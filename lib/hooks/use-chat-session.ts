"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import { toast } from "sonner";
import { ABORTED } from "@/lib/utils";

interface UseChatSessionOptions {
  activeSessionId: string | null;
  activeSession: { messages: Message[] } | null;
  sandboxId: string | null;
  createSession: () => string;
  updateSessionMessages: (id: string, messages: Message[]) => void;
}

export function useChatSession({
  activeSessionId,
  activeSession,
  sandboxId,
  createSession,
  updateSessionMessages,
}: UseChatSessionOptions) {
  const [chatKey, setChatKey] = useState(0);
  const currentSessionRef = useRef<string | null>(activeSessionId);
  const isSwitchingRef = useRef(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    status,
    stop: stopGeneration,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: activeSessionId ?? undefined,
    body: { sandboxId },
    initialMessages: activeSession?.messages ?? [],
    maxSteps: 30,
    onError: (error) => {
      console.error(error);
      toast.error("There was an error", {
        description: "Please try again later.",
        richColors: true,
        position: "top-center",
      });
    },
  });

  // Track which session ref the persistence effect should accept writes for.
  // resetMessages sets this to the OLD id so transient mid-switch renders
  // don't get persisted. Once activeSessionId actually changes, sync it.
  useEffect(() => {
    if (activeSessionId && activeSessionId !== currentSessionRef.current) {
      currentSessionRef.current = activeSessionId;
    }
  }, [activeSessionId]);

  // Persist messages back to session store, but skip during a session switch
  // to avoid writing mid-transition state back to the wrong session.
  useEffect(() => {
    if (
      activeSessionId &&
      messages.length > 0 &&
      !isSwitchingRef.current &&
      currentSessionRef.current === activeSessionId
    ) {
      updateSessionMessages(activeSessionId, messages);
    }
  }, [messages, activeSessionId, updateSessionMessages]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeSessionId) {
        createSession();
        // Don't bump chatKey here — the session change will trigger the new
        // useChat instance to pick up the new id on the next render.
      }
      originalHandleSubmit(e);
    },
    [activeSessionId, createSession, originalHandleSubmit]
  );

  const handleAppend = useCallback(
    (message: { role: "user"; content: string }) => {
      if (!activeSessionId) {
        createSession();
      }
      append(message);
    },
    [activeSessionId, createSession, append]
  );

  const stop = useCallback(() => {
    stopGeneration();

    const lastMessage = messages.at(-1);
    const lastPart = lastMessage?.parts?.at(-1);
    if (lastMessage?.role === "assistant" && lastPart?.type === "tool-invocation") {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          parts: [
            ...(lastMessage.parts?.slice(0, -1) || []),
            {
              ...lastPart,
              toolInvocation: {
                ...lastPart.toolInvocation,
                state: "result",
                result: ABORTED,
              },
            },
          ],
        },
      ]);
    }
  }, [messages, setMessages, stopGeneration]);

  // Called externally (handleSwitchSession / handleCreateSession) immediately
  // before the active session changes. Bumps chatKey so ChatPanel + useChat
  // fully remount under the new id, picking up initialMessages cleanly. The
  // OLD-id ref guard prevents stale persistence during the transition.
  const resetMessages = useCallback(() => {
    isSwitchingRef.current = true;
    currentSessionRef.current = activeSessionId;
    setChatKey((k) => k + 1);
    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 0);
  }, [activeSessionId]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    isLoading: status !== "ready",
    stop,
    append: handleAppend,
    setMessages,
    resetMessages,
    chatKey,
  };
}
