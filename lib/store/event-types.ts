export type ToolCallStatus = "pending" | "running" | "completed" | "error" | "aborted";

export type ComputerAction =
  | "screenshot"
  | "left_click"
  | "right_click"
  | "double_click"
  | "mouse_move"
  | "type"
  | "key"
  | "wait"
  | "scroll";

export type EventType = "computer_tool" | "bash_tool";

export interface BaseToolCallEvent {
  id: string;
  timestamp: number;
  status: ToolCallStatus;
  duration: number | null;
  startedAt: number | null;
  completedAt: number | null;
  toolCallId: string;
}

export interface ComputerToolCallEvent extends BaseToolCallEvent {
  type: "computer_tool";
  action: ComputerAction;
  payload: {
    coordinate?: [number, number];
    text?: string;
    duration?: number;
    scroll_direction?: "up" | "down";
    scroll_amount?: number;
  };
  result?: ComputerToolResult;
}

export interface ComputerToolResult {
  type: "image" | "text";
  data?: string;
  text?: string;
}

export interface BashToolCallEvent extends BaseToolCallEvent {
  type: "bash_tool";
  payload: {
    command: string;
  };
  result?: BashToolResult;
}

export interface BashToolResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export type ToolCallEvent = ComputerToolCallEvent | BashToolCallEvent;

export interface EventCounts {
  screenshot: number;
  left_click: number;
  right_click: number;
  double_click: number;
  mouse_move: number;
  type: number;
  key: number;
  wait: number;
  scroll: number;
  bash: number;
  [key: string]: number;
}

export type AgentStatus = "idle" | "thinking" | "acting" | "error";

export interface SessionEvents {
  [sessionId: string]: ToolCallEvent[];
}

export interface EventStoreState {
  eventsBySession: SessionEvents;
  activeSessionId: string | null;
  selectedToolCallId: string | null;
}

export interface EventStoreActions {
  setActiveSession: (sessionId: string | null) => void;
  addEvent: (event: Omit<ToolCallEvent, "id" | "timestamp">) => string;
  updateEvent: (id: string, updates: Partial<ToolCallEvent>) => void;
  upsertEvent: (event: Omit<ToolCallEvent, "id" | "timestamp">) => string;
  selectToolCall: (toolCallId: string | null) => void;
  clearEvents: () => void;
  clearAllSessionEvents: (sessionId: string) => void;
}

export interface EventStoreDerived {
  events: ToolCallEvent[];
  eventCounts: EventCounts;
  agentStatus: AgentStatus;
  getEventById: (id: string) => ToolCallEvent | undefined;
  selectedEvent: ToolCallEvent | null;
}

export type EventStore = EventStoreState & EventStoreActions & EventStoreDerived;

const STORAGE_KEY = "ai-sdk-computer-use-events";

export function loadEventsFromStorage(): EventStoreState {
  if (typeof window === "undefined") {
    return { eventsBySession: {}, activeSessionId: null, selectedToolCallId: null };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        eventsBySession: parsed.eventsBySession || {},
        activeSessionId: parsed.activeSessionId,
        selectedToolCallId: null,
      };
    }
  } catch (error) {
    console.error("Failed to load events from localStorage:", error);
  }

  return { eventsBySession: {}, activeSessionId: null, selectedToolCallId: null };
}

export function saveEventsToStorage(state: EventStoreState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save events to localStorage:", error);
  }
}

export function generateEventId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getInitialEventCounts(): EventCounts {
  return {
    screenshot: 0,
    left_click: 0,
    right_click: 0,
    double_click: 0,
    mouse_move: 0,
    type: 0,
    key: 0,
    wait: 0,
    scroll: 0,
    bash: 0,
  };
}

export function calculateEventCounts(events: ToolCallEvent[]): EventCounts {
  const counts = getInitialEventCounts();
  for (const event of events) {
    if (event.type === "computer_tool") {
      counts[event.action]++;
    } else if (event.type === "bash_tool") {
      counts.bash++;
    }
  }
  return counts;
}

export function calculateAgentStatus(events: ToolCallEvent[]): AgentStatus {
  if (events.length === 0) return "idle";

  const lastEvent = events[events.length - 1];

  if (lastEvent.status === "running") return "acting";
  if (lastEvent.status === "error") return "error";

  const hasRunning = events.some((e) => e.status === "running");
  if (hasRunning) return "acting";

  return "thinking";
}

export function isComputerToolCallEvent(event: ToolCallEvent): event is ComputerToolCallEvent {
  return event.type === "computer_tool";
}

export function isBashToolCallEvent(event: ToolCallEvent): event is BashToolCallEvent {
  return event.type === "bash_tool";
}
