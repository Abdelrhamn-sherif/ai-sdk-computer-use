"use client";

import { useContext, useMemo } from "react";
import type { ToolCallEvent, EventCounts, AgentStatus } from "./event-types";
import { calculateEventCounts, calculateAgentStatus } from "./event-types";
import { EventContext } from "./event-context";
import { useSessionContext } from "./session-context";

function useEventCtx() {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error("Event selector hooks must be used within an EventProvider");
  }
  return ctx;
}

/**
 * Returns the events for the currently active session. Reads activeSessionId
 * from the session store and looks up that bucket in the event store. There
 * is never any "active session" stored in the event store itself — so there's
 * nothing to sync, nothing to race.
 */
export function useEvents(): ToolCallEvent[] {
  const { activeSessionId } = useSessionContext();
  const { eventsBySession } = useEventCtx();
  return useMemo(
    () => (activeSessionId ? eventsBySession[activeSessionId] || [] : []),
    [eventsBySession, activeSessionId]
  );
}

export function useEventCounts(): EventCounts {
  const events = useEvents();
  return useMemo(() => calculateEventCounts(events), [events]);
}

export function useAgentStatus(): AgentStatus {
  const events = useEvents();
  return useMemo(() => calculateAgentStatus(events), [events]);
}

export function useSelectedEvent(): ToolCallEvent | null {
  const events = useEvents();
  const { selectedToolCallId } = useEventCtx();
  return useMemo(
    () =>
      selectedToolCallId
        ? events.find((e) => e.toolCallId === selectedToolCallId) ?? null
        : null,
    [events, selectedToolCallId]
  );
}

export function useToolCall(toolCallId: string | null): ToolCallEvent | undefined {
  const events = useEvents();
  return useMemo(
    () => (toolCallId ? events.find((e) => e.toolCallId === toolCallId) : undefined),
    [events, toolCallId]
  );
}

export function useSelectedToolCallId(): string | null {
  return useEventCtx().selectedToolCallId;
}

export function useSelectToolCall() {
  return useEventCtx().selectToolCall;
}

/**
 * Returns event-mutation actions. The returned object is stable across renders
 * because the underlying actions are wrapped in useCallback([]) inside the store.
 */
export function useEventActions() {
  const ctx = useEventCtx();
  return useMemo(
    () => ({
      upsertEvent: ctx.upsertEvent,
      clearSessionEvents: ctx.clearSessionEvents,
      deleteSessionEvents: ctx.deleteSessionEvents,
    }),
    [ctx.upsertEvent, ctx.clearSessionEvents, ctx.deleteSessionEvents]
  );
}
