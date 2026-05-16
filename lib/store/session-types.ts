import type { Message } from "ai";

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  sandboxId?: string;
}

export interface SessionStoreState {
  sessions: ChatSession[];
  activeSessionId: string | null;
}

export interface SessionStoreActions {
  createSession: (title?: string) => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  updateSessionMessages: (id: string, messages: Message[]) => void;
  updateSessionTitle: (id: string, title: string) => void;
  updateSessionSandboxId: (id: string, sandboxId: string) => void;
  getActiveSession: () => ChatSession | null;
}

const STORAGE_KEY = "ai-sdk-computer-use-sessions";

export function loadSessionsFromStorage(): SessionStoreState {
  if (typeof window === "undefined") {
    return { sessions: [], activeSessionId: null };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as SessionStoreState;
      return parsed;
    }
  } catch (error) {
    console.error("Failed to load sessions from localStorage:", error);
  }

  return { sessions: [], activeSessionId: null };
}

export function saveSessionsToStorage(state: SessionStoreState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save sessions to localStorage:", error);
  }
}

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateSessionTitle(messages: Message[]): string {
  if (messages.length === 0) return "New Chat";

  const firstUserMessage = messages.find((m) => m.role === "user");
  if (firstUserMessage) {
    const content =
      typeof firstUserMessage.content === "string"
        ? firstUserMessage.content
        : "";
    return content.slice(0, 50) + (content.length > 50 ? "..." : "");
  }

  return "New Chat";
}
