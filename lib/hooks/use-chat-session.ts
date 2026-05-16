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
  setActiveSession: (id: string | null) => void;
}

export function useChatSession({
  activeSessionId,
  activeSession,
  sandboxId,
  createSession,
  updateSessionMessages,
  setActiveSession,
}: UseChatSessionOptions) {
  const [chatKey, setChatKey] = useState(0);
  const currentSessionRef = useRef<string | null>(activeSessionId);
  const isSessionSwitchingRef = useRef(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    status,
    stop: stopGeneration,
    append,
    setMessages,
    reload,
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

  useEffect(() => {
    if (activeSessionId && activeSessionId !== currentSessionRef.current) {
      isSessionSwitchingRef.current = true;
      currentSessionRef.current = activeSessionId;
      setMessages(activeSession?.messages ?? []);
      setChatKey((prev) => prev + 1);
      
      requestAnimationFrame(() => {
        isSessionSwitchingRef.current = false;
      });
    }
  }, [activeSessionId, activeSession, setMessages]);

  useEffect(() => {
    if (
      activeSessionId &&
      messages.length > 0 &&
      !isSessionSwitchingRef.current &&
      currentSessionRef.current === activeSessionId
    ) {
      updateSessionMessages(activeSessionId, messages);
    }
  }, [messages, activeSessionId, updateSessionMessages]);

  useEffect(() => {
    if (activeSessionId) {
      setActiveSession(activeSessionId);
    }
  }, [activeSessionId, setActiveSession]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!activeSessionId) {
        const newSessionId = createSession();
        currentSessionRef.current = newSessionId;
        setActiveSession(newSessionId);
        setChatKey((prev) => prev + 1);
      }
      
      originalHandleSubmit(e);
    },
    [activeSessionId, createSession, setActiveSession, originalHandleSubmit]
  );

  const handleAppend = useCallback(
    (message: { role: "user"; content: string }) => {
      let sessionId = activeSessionId;
      
      if (!sessionId) {
        sessionId = createSession();
        currentSessionRef.current = sessionId;
        setActiveSession(sessionId);
        setChatKey((prev) => prev + 1);
      }
      
      append(message);
    },
    [activeSessionId, createSession, setActiveSession, append]
  );

  const stop = useCallback(() => {
    stopGeneration();

    const lastMessage = messages.at(-1);
    const lastMessageLastPart = lastMessage?.parts?.at(-1);
    if (
      lastMessage?.role === "assistant" &&
      lastMessageLastPart?.type === "tool-invocation"
    ) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          parts: [
            ...(lastMessage.parts?.slice(0, -1) || []),
            {
              ...lastMessageLastPart,
              toolInvocation: {
                ...lastMessageLastPart.toolInvocation,
                state: "result",
                result: ABORTED,
              },
            },
          ],
        },
      ]);
    }
  }, [messages, setMessages, stopGeneration]);

  const resetMessages = useCallback(
    (newMessages: Message[] = []) => {
      setMessages(newMessages);
      setChatKey((prev) => prev + 1);
    },
    [setMessages]
  );

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
    reload,
  };
}
