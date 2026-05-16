"use client";

import { memo, useState, useCallback } from "react";
import {
  useEvents,
  useSelectedToolCallId,
  useSelectToolCall,
  useEventCounts,
  useAgentStatus,
  useEventActions,
  useSessionContext,
} from "@/lib/store";
import type { ToolCallEvent, ComputerToolCallEvent, BashToolCallEvent } from "@/lib/store";
import { isComputerToolCallEvent, isBashToolCallEvent } from "@/lib/store";
import {
  ChevronDown,
  ChevronUp,
  Bug,
  Trash2,
  Activity,
  Camera,
  MousePointer,
  Keyboard,
  Clock,
  ScrollText,
  Terminal,
  Loader2,
  CheckCircle,
  CircleSlash,
} from "lucide-react";
import { cn } from "@/lib/utils";

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  screenshot: Camera,
  left_click: MousePointer,
  right_click: MousePointer,
  double_click: MousePointer,
  mouse_move: MousePointer,
  type: Keyboard,
  key: Keyboard,
  wait: Clock,
  scroll: ScrollText,
  bash: Terminal,
};

const statusColors: Record<string, string> = {
  pending: "text-yellow-500",
  running: "text-blue-500",
  completed: "text-green-500",
  error: "text-red-500",
  aborted: "text-amber-500",
};

const statusBgColors: Record<string, string> = {
  pending: "bg-yellow-50 border-yellow-200",
  running: "bg-blue-50 border-blue-200",
  completed: "bg-green-50 border-green-200",
  error: "bg-red-50 border-red-200",
  aborted: "bg-amber-50 border-amber-200",
};

function getStatusIcon(status: string): React.ComponentType<{ className?: string }> {
  switch (status) {
    case "running":
      return Loader2;
    case "completed":
      return CheckCircle;
    case "error":
    case "aborted":
      return CircleSlash;
    default:
      return Clock;
  }
}

interface EventItemProps {
  event: ToolCallEvent;
  isSelected: boolean;
  onSelect: () => void;
}

const EventItem = memo(function EventItem({
  event,
  isSelected,
  onSelect,
}: EventItemProps) {
  const isComputer = isComputerToolCallEvent(event);
  const isBash = isBashToolCallEvent(event);

  const iconKey = isComputer ? event.action : "bash";
  const Icon = actionIcons[iconKey] || Terminal;
  const StatusIcon = getStatusIcon(event.status);
  const time = new Date(event.timestamp).toLocaleTimeString();

  const actionLabel = isComputer
    ? event.action.replace("_", " ")
    : "bash command";

  let detail = "";
  if (isComputer) {
    const computerEvent = event as ComputerToolCallEvent;
    if (computerEvent.payload.coordinate) {
      detail = `(${computerEvent.payload.coordinate[0]}, ${computerEvent.payload.coordinate[1]})`;
    } else if (computerEvent.payload.text) {
      const text = computerEvent.payload.text;
      detail = `"${text.slice(0, 20)}${text.length > 20 ? "..." : ""}"`;
    }
  } else if (isBash) {
    const bashEvent = event as BashToolCallEvent;
    detail = bashEvent.payload.command.slice(0, 20) || "";
  }

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-2 border rounded-md transition-colors hover:bg-zinc-100",
        isSelected ? "bg-zinc-100 ring-1 ring-zinc-400" : "",
        statusBgColors[event.status]
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full border shrink-0">
          <Icon className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium capitalize truncate">
              {actionLabel}
            </span>
            <span className="text-[10px] text-zinc-500 truncate">{detail}</span>
          </div>
          <span className="text-[10px] text-zinc-400">{time}</span>
        </div>
        <StatusIcon
          className={cn(
            "w-4 h-4 shrink-0",
            statusColors[event.status],
            event.status === "running" && "animate-spin"
          )}
        />
      </div>
    </button>
  );
});

export const DebugPanel = memo(function DebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const events = useEvents();
  const selectedToolCallId = useSelectedToolCallId();
  const selectToolCall = useSelectToolCall();
  const { clearSessionEvents } = useEventActions();
  const { activeSessionId } = useSessionContext();
  const eventCounts = useEventCounts();
  const agentStatus = useAgentStatus();

  const totalEvents = events.length;

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleClearEvents = useCallback(() => {
    if (activeSessionId) clearSessionEvents(activeSessionId);
  }, [clearSessionEvents, activeSessionId]);

  const handleEventSelect = useCallback((toolCallId: string) => {
    selectToolCall(toolCallId === selectedToolCallId ? null : toolCallId);
  }, [selectToolCall, selectedToolCallId]);

  return (
    <div className="border-t border-zinc-200 bg-zinc-50">
      <button
        onClick={handleToggleExpand}
        className="w-full flex items-center justify-between p-2 hover:bg-zinc-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium">Debug Panel</span>
          <span className="text-xs text-zinc-500">({totalEvents} events)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-200 rounded-full">
            <Activity className="w-3 h-3" />
            <span className="text-xs capitalize">{agentStatus}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-2 border-t border-zinc-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-wrap gap-1">
              {Object.entries(eventCounts).map(([action, count]) =>
                count > 0 ? (
                  <span
                    key={action}
                    className="text-[10px] px-1.5 py-0.5 bg-zinc-200 rounded"
                  >
                    {action}: {count}
                  </span>
                ) : null
              )}
            </div>
            <button
              onClick={handleClearEvents}
              className="p-1 hover:bg-zinc-200 rounded transition-colors"
              title="Clear events"
            >
              <Trash2 className="w-3 h-3 text-zinc-500" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {events.length === 0 ? (
              <div className="text-xs text-zinc-400 text-center py-4">
                No events recorded
              </div>
            ) : (
              [...events].reverse().map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  isSelected={event.toolCallId === selectedToolCallId}
                  onSelect={() => handleEventSelect(event.toolCallId)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});
