"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Message } from "ai";
import type {
  ChatSession,
  SessionStoreState,
  SessionStoreActions,
} from "./session-types";
import {
  loadSessionsFromStorage,
  saveSessionsToStorage,
  generateSessionId,
  generateSessionTitle,
} from "./session-types";

export function useSessionStore() {
  const [state, setState] = useState<SessionStoreState>({
    sessions: [],
    activeSessionId: null,
  });

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = loadSessionsFromStorage();
    setState(stored);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      saveSessionsToStorage(state);
    }
  }, [state, isHydrated]);

  const createSession = useCallback((): string => {
    const id = generateSessionId();
    const now = Date.now();

    const newSession: ChatSession = {
      id,
      title: "New Chat",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    setState((prev) => ({
      sessions: [newSession, ...prev.sessions],
      activeSessionId: id,
    }));

    return id;
  }, []);

  const switchSession = useCallback((id: string): void => {
    setState((prev) => ({
      ...prev,
      activeSessionId: id,
    }));
  }, []);

  const deleteSession = useCallback((id: string): void => {
    setState((prev) => {
      const newSessions = prev.sessions.filter((s) => s.id !== id);
      const newActiveId =
        prev.activeSessionId === id
          ? newSessions.length > 0
            ? newSessions[0].id
            : null
          : prev.activeSessionId;

      return {
        sessions: newSessions,
        activeSessionId: newActiveId,
      };
    });
  }, []);

  const updateSessionMessages = useCallback(
    (id: string, messages: Message[]): void => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((session) =>
          session.id === id
            ? {
                ...session,
                messages,
                title:
                  session.title === "New Chat" && messages.length > 0
                    ? generateSessionTitle(messages)
                    : session.title,
                updatedAt: Date.now(),
              }
            : session
        ),
      }));
    },
    []
  );

  const updateSessionTitle = useCallback((id: string, title: string): void => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === id
          ? { ...session, title, updatedAt: Date.now() }
          : session
      ),
    }));
  }, []);

  const updateSessionSandboxId = useCallback(
    (id: string, sandboxId: string): void => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((session) =>
          session.id === id
            ? { ...session, sandboxId, updatedAt: Date.now() }
            : session
        ),
      }));
    },
    []
  );

  const getActiveSession = useCallback((): ChatSession | null => {
    return state.sessions.find((s) => s.id === state.activeSessionId) || null;
  }, [state.sessions, state.activeSessionId]);

  const actions: SessionStoreActions = useMemo(
    () => ({
      createSession,
      switchSession,
      deleteSession,
      updateSessionMessages,
      updateSessionTitle,
      updateSessionSandboxId,
      getActiveSession,
    }),
    [
      createSession,
      switchSession,
      deleteSession,
      updateSessionMessages,
      updateSessionTitle,
      updateSessionSandboxId,
      getActiveSession,
    ]
  );

  return {
    ...state,
    ...actions,
    isHydrated,
    activeSession: state.activeSessionId
      ? state.sessions.find((s) => s.id === state.activeSessionId)
      : null,
  };
}
