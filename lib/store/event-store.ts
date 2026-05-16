"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  ToolCallEvent,
  EventStoreState,
  ComputerToolCallEvent,
  BashToolCallEvent,
  ComputerAction,
} from "./event-types";
import {
  loadEventsFromStorage,
  saveEventsToStorage,
  generateEventId,
} from "./event-types";

/**
 * Single source of truth for tool-call events. The store does NOT know which
 * session is active — it just maps sessionId -> events. The "active session"
 * is owned by the session store, and selectors combine the two.
 *
 * This eliminates the entire class of race conditions that come from keeping
 * two stores in sync.
 */
export function useEventStore() {
  const [state, setState] = useState<EventStoreState>({
    eventsBySession: {},
    selectedToolCallId: null,
  });

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = loadEventsFromStorage();
    setState(stored);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      saveEventsToStorage(state);
    }
  }, [state, isHydrated]);

  const upsertEvent = useCallback(
    (
      sessionId: string,
      event: Omit<ToolCallEvent, "id" | "timestamp">
    ): string => {
      if (!sessionId) return "";

      let eventId = "";

      setState((prev) => {
        const currentEvents = prev.eventsBySession[sessionId] || [];
        const existingIndex = currentEvents.findIndex(
          (e) => e.toolCallId === event.toolCallId
        );

        if (existingIndex !== -1) {
          const existing = currentEvents[existingIndex];
          eventId = existing.id;

          // Skip if nothing meaningful changed — keeps the store reference
          // stable and avoids re-renders / re-persistence on every stream chunk.
          const nextCompletedAt =
            event.completedAt != null ? event.completedAt : existing.completedAt;
          const nextResult =
            event.result !== undefined ? event.result : existing.result;

          if (
            existing.status === event.status &&
            existing.completedAt === nextCompletedAt &&
            existing.result === nextResult
          ) {
            return prev;
          }

          const updated = [...currentEvents];
          updated[existingIndex] = {
            ...existing,
            status: event.status,
            completedAt: nextCompletedAt,
            result: nextResult,
          } as ToolCallEvent;

          return {
            ...prev,
            eventsBySession: { ...prev.eventsBySession, [sessionId]: updated },
          };
        }

        const id = generateEventId();
        eventId = id;
        const newEvent = { ...event, id, timestamp: Date.now() } as ToolCallEvent;

        return {
          ...prev,
          eventsBySession: {
            ...prev.eventsBySession,
            [sessionId]: [...currentEvents, newEvent],
          },
        };
      });

      return eventId;
    },
    []
  );

  const selectToolCall = useCallback((toolCallId: string | null): void => {
    setState((prev) =>
      prev.selectedToolCallId === toolCallId
        ? prev
        : { ...prev, selectedToolCallId: toolCallId }
    );
  }, []);

  const clearSessionEvents = useCallback((sessionId: string): void => {
    setState((prev) => {
      if (!prev.eventsBySession[sessionId]) return prev;
      return {
        ...prev,
        eventsBySession: { ...prev.eventsBySession, [sessionId]: [] },
        selectedToolCallId: null,
      };
    });
  }, []);

  const deleteSessionEvents = useCallback((sessionId: string): void => {
    setState((prev) => {
      if (!(sessionId in prev.eventsBySession)) return prev;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [sessionId]: _, ...remaining } = prev.eventsBySession;
      return { ...prev, eventsBySession: remaining };
    });
  }, []);

  return {
    eventsBySession: state.eventsBySession,
    selectedToolCallId: state.selectedToolCallId,
    isHydrated,
    upsertEvent,
    selectToolCall,
    clearSessionEvents,
    deleteSessionEvents,
  };
}

export function mapToolInvocationToEvent(
  toolName: string,
  toolCallId: string,
  invocationState: "call" | "result",
  args: Record<string, unknown>,
  result?: unknown
):
  | Omit<ComputerToolCallEvent, "id" | "timestamp">
  | Omit<BashToolCallEvent, "id" | "timestamp">
  | null {
  if (toolName === "computer") {
    const action = args.action as ComputerAction;
    const payload: ComputerToolCallEvent["payload"] = {
      coordinate: args.coordinate as [number, number] | undefined,
      text: args.text as string | undefined,
      duration: args.duration as number | undefined,
      scroll_direction: args.scroll_direction as "up" | "down" | undefined,
      scroll_amount: args.scroll_amount as number | undefined,
    };

    const status = invocationState === "call" ? "running" : "completed";
    const now = Date.now();

    return {
      type: "computer_tool",
      toolCallId,
      action,
      status,
      payload,
      duration: null,
      startedAt: invocationState === "call" ? now : null,
      completedAt: invocationState === "result" ? now : null,
      result:
        invocationState === "result" && result
          ? (result as ComputerToolCallEvent["result"])
          : undefined,
    };
  }

  if (toolName === "bash") {
    const payload: BashToolCallEvent["payload"] = {
      command: args.command as string,
    };

    const status = invocationState === "call" ? "running" : "completed";
    const now = Date.now();

    return {
      type: "bash_tool",
      toolCallId,
      status,
      payload,
      duration: null,
      startedAt: invocationState === "call" ? now : null,
      completedAt: invocationState === "result" ? now : null,
      result:
        invocationState === "result" && result
          ? (result as BashToolCallEvent["result"])
          : undefined,
    };
  }

  return null;
}
