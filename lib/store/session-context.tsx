"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Message } from "ai";
import type { ChatSession } from "./session-types";
import { useSessionStore } from "./session-store";

interface SessionContextValue {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeSession: ChatSession | null;
  isHydrated: boolean;
  createSession: (title?: string) => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  updateSessionMessages: (id: string, messages: Message[]) => void;
  updateSessionTitle: (id: string, title: string) => void;
  updateSessionSandboxId: (id: string, sandboxId: string) => void;
  getActiveSession: () => ChatSession | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const store = useSessionStore();

  const value = useMemo(
    () => ({
      sessions: store.sessions,
      activeSessionId: store.activeSessionId,
      activeSession: store.activeSession ?? null,
      isHydrated: store.isHydrated,
      createSession: store.createSession,
      switchSession: store.switchSession,
      deleteSession: store.deleteSession,
      updateSessionMessages: store.updateSessionMessages,
      updateSessionTitle: store.updateSessionTitle,
      updateSessionSandboxId: store.updateSessionSandboxId,
      getActiveSession: store.getActiveSession,
    }),
    [
      store.sessions,
      store.activeSessionId,
      store.activeSession,
      store.isHydrated,
      store.createSession,
      store.switchSession,
      store.deleteSession,
      store.updateSessionMessages,
      store.updateSessionTitle,
      store.updateSessionSandboxId,
      store.getActiveSession,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}
