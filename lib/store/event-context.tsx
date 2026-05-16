"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SessionEvents, ToolCallEvent } from "./event-types";
import { useEventStore } from "./event-store";

export interface EventContextValue {
  eventsBySession: SessionEvents;
  selectedToolCallId: string | null;
  isHydrated: boolean;
  upsertEvent: (
    sessionId: string,
    event: Omit<ToolCallEvent, "id" | "timestamp">
  ) => string;
  selectToolCall: (toolCallId: string | null) => void;
  clearSessionEvents: (sessionId: string) => void;
  deleteSessionEvents: (sessionId: string) => void;
}

export const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  const store = useEventStore();

  // Actions are stable (created with useCallback in the store), so we memoize
  // them separately so state changes don't cause action re-references.
  const actions = useMemo(
    () => ({
      upsertEvent: store.upsertEvent,
      selectToolCall: store.selectToolCall,
      clearSessionEvents: store.clearSessionEvents,
      deleteSessionEvents: store.deleteSessionEvents,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // All actions are stable useCallback refs — no deps needed
  );

  const value = useMemo<EventContextValue>(
    () => ({
      eventsBySession: store.eventsBySession,
      selectedToolCallId: store.selectedToolCallId,
      isHydrated: store.isHydrated,
      ...actions,
    }),
    [store.eventsBySession, store.selectedToolCallId, store.isHydrated, actions]
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext(): EventContextValue {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEventContext must be used within an EventProvider");
  }
  return context;
}
