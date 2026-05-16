"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ToolCallEvent, EventCounts, AgentStatus } from "./event-types";
import { useEventStore } from "./event-store";

interface EventContextValue {
  events: ToolCallEvent[];
  selectedEventId: string | null;
  isHydrated: boolean;
  setActiveSession: (sessionId: string | null) => void;
  addEvent: (event: Omit<ToolCallEvent, "id" | "timestamp">) => string;
  updateEvent: (id: string, updates: Partial<ToolCallEvent>) => void;
  selectEvent: (id: string | null) => void;
  clearEvents: () => void;
  clearAllSessionEvents: (sessionId: string) => void;
  eventCounts: EventCounts;
  agentStatus: AgentStatus;
  getEventById: (id: string) => ToolCallEvent | undefined;
  getSelectedEvent: () => ToolCallEvent | null;
}

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  const store = useEventStore();

  const value = useMemo(
    () => ({
      events: store.events,
      selectedEventId: store.selectedEventId,
      isHydrated: store.isHydrated,
      setActiveSession: store.setActiveSession,
      addEvent: store.addEvent,
      updateEvent: store.updateEvent,
      selectEvent: store.selectEvent,
      clearEvents: store.clearEvents,
      clearAllSessionEvents: store.clearAllSessionEvents,
      eventCounts: store.eventCounts,
      agentStatus: store.agentStatus,
      getEventById: store.getEventById,
      getSelectedEvent: store.getSelectedEvent,
    }),
    [
      store.events,
      store.selectedEventId,
      store.isHydrated,
      store.setActiveSession,
      store.addEvent,
      store.updateEvent,
      store.selectEvent,
      store.clearEvents,
      store.clearAllSessionEvents,
      store.eventCounts,
      store.agentStatus,
      store.getEventById,
      store.getSelectedEvent,
    ]
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
