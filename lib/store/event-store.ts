"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  ToolCallEvent,
  EventCounts,
  AgentStatus,
  EventStoreState,
  EventStoreActions,
  EventStoreDerived,
  ComputerToolCallEvent,
  BashToolCallEvent,
  ComputerAction,
} from "./event-types";
import {
  loadEventsFromStorage,
  saveEventsToStorage,
  generateEventId,
  calculateEventCounts,
  calculateAgentStatus,
} from "./event-types";

export function useEventStore() {
  const [state, setState] = useState<EventStoreState>({
    eventsBySession: {},
    activeSessionId: null,
    selectedEventId: null,
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

  const setActiveSession = useCallback((sessionId: string | null): void => {
    setState((prev) => ({
      ...prev,
      activeSessionId: sessionId,
      selectedEventId: null,
    }));
  }, []);

  const addEvent = useCallback(
    (event: Omit<ToolCallEvent, "id" | "timestamp">): string => {
      const id = generateEventId();
      const timestamp = Date.now();
      const newEvent = { ...event, id, timestamp } as ToolCallEvent;

      setState((prev) => {
        const sessionId = prev.activeSessionId;
        if (!sessionId) return prev;

        const currentEvents = prev.eventsBySession[sessionId] || [];
        return {
          ...prev,
          eventsBySession: {
            ...prev.eventsBySession,
            [sessionId]: [...currentEvents, newEvent],
          },
        };
      });

      return id;
    },
    []
  );

  const updateEvent = useCallback((id: string, updates: Partial<ToolCallEvent>): void => {
    setState((prev) => {
      const sessionId = prev.activeSessionId;
      if (!sessionId) return prev;

      const sessionEvents = prev.eventsBySession[sessionId];
      if (!sessionEvents) return prev;

      return {
        ...prev,
        eventsBySession: {
          ...prev.eventsBySession,
          [sessionId]: sessionEvents.map((event) =>
            event.id === id ? ({ ...event, ...updates } as ToolCallEvent) : event
          ),
        },
      };
    });
  }, []);

  const selectEvent = useCallback((id: string | null): void => {
    setState((prev) => ({ ...prev, selectedEventId: id }));
  }, []);

  const clearEvents = useCallback((): void => {
    setState((prev) => {
      const sessionId = prev.activeSessionId;
      if (!sessionId) return prev;

      return {
        ...prev,
        eventsBySession: {
          ...prev.eventsBySession,
          [sessionId]: [],
        },
        selectedEventId: null,
      };
    });
  }, []);

  const clearAllSessionEvents = useCallback((sessionId: string): void => {
    setState((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [sessionId]: _, ...remaining } = prev.eventsBySession;
      return {
        ...prev,
        eventsBySession: remaining,
      };
    });
  }, []);

  const derived = useMemo<EventStoreDerived>(() => {
    const sessionId = state.activeSessionId;
    const events: ToolCallEvent[] = sessionId
      ? (state.eventsBySession[sessionId] || [])
      : [];

    const eventCounts: EventCounts = calculateEventCounts(events);
    const agentStatus: AgentStatus = calculateAgentStatus(events);

    const getEventById = (id: string): ToolCallEvent | undefined => {
      return events.find((e) => e.id === id);
    };

    const getSelectedEvent = (): ToolCallEvent | null => {
      if (!state.selectedEventId) return null;
      return events.find((e) => e.id === state.selectedEventId) || null;
    };

    return { events, eventCounts, agentStatus, getEventById, getSelectedEvent };
  }, [state.eventsBySession, state.activeSessionId, state.selectedEventId]);

  const actions: EventStoreActions = useMemo(
    () => ({
      setActiveSession,
      addEvent,
      updateEvent,
      selectEvent,
      clearEvents,
      clearAllSessionEvents,
    }),
    [setActiveSession, addEvent, updateEvent, selectEvent, clearEvents, clearAllSessionEvents]
  );

  return {
    ...state,
    ...actions,
    ...derived,
    isHydrated,
  };
}

export function mapToolInvocationToEvent(
  toolName: string,
  toolCallId: string,
  invocationState: "call" | "result",
  args: Record<string, unknown>,
  result?: unknown
): Omit<ComputerToolCallEvent, "id" | "timestamp"> | Omit<BashToolCallEvent, "id" | "timestamp"> | null {
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

    const computerEvent: Omit<ComputerToolCallEvent, "id" | "timestamp"> = {
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
    return computerEvent;
  }

  if (toolName === "bash") {
    const payload: BashToolCallEvent["payload"] = {
      command: args.command as string,
    };

    const status = invocationState === "call" ? "running" : "completed";
    const now = Date.now();

    const bashEvent: Omit<BashToolCallEvent, "id" | "timestamp"> = {
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
    return bashEvent;
  }

  return null;
}
