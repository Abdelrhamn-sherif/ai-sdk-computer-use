"use client";

import { memo, useCallback } from "react";
import { useEventContext } from "@/lib/store";
import type { ComputerToolCallEvent, BashToolCallEvent } from "@/lib/store";
import { isComputerToolCallEvent, isBashToolCallEvent } from "@/lib/store";
import {
  Camera,
  MousePointer,
  Keyboard,
  Clock,
  ScrollText,
  Terminal,
  Loader2,
  CheckCircle,
  CircleSlash,
  X,
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
  pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  running: "text-blue-600 bg-blue-50 border-blue-200",
  completed: "text-green-600 bg-green-50 border-green-200",
  error: "text-red-600 bg-red-50 border-red-200",
  aborted: "text-amber-600 bg-amber-50 border-amber-200",
};

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function formatDuration(start: number | null, end: number | null): string {
  if (!start || !end) return "-";
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

interface EventSummaryProps {
  eventCounts: Record<string, number>;
}

const EventSummary = memo(function EventSummary({ eventCounts }: EventSummaryProps) {
  return (
    <div className="border-t border-zinc-200 pt-3 mt-3">
      <h4 className="text-xs font-medium text-zinc-500 mb-2">Event Summary</h4>
      <div className="grid grid-cols-2 gap-1 text-xs">
        {Object.entries(eventCounts).map(([action, count]) => (
          <div key={action} className="flex justify-between">
            <span className="capitalize">{action.replace("_", " ")}:</span>
            <span className="font-mono">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

interface ToolCallDisplayProps {
  event: ComputerToolCallEvent | BashToolCallEvent;
  onClose: () => void;
}

const ToolCallDisplay = memo(function ToolCallDisplay({ event, onClose }: ToolCallDisplayProps) {
  const isComputer = isComputerToolCallEvent(event);
  const isBash = isBashToolCallEvent(event);

  const iconKey = isComputer ? event.action : "bash";
  const Icon = actionIcons[iconKey] || Terminal;

  const title = isComputer
    ? event.action.replace("_", " ")
    : "Bash Command";

  return (
    <div className="p-4 border-b border-zinc-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Tool Call Details</h3>
        <button
          onClick={onClose}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Close</span>
        </button>
      </div>

      <div className={cn("p-3 rounded-lg border", statusColors[event.status])}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5" />
          <span className="font-medium capitalize">{title}</span>
          {event.status === "running" && (
            <Loader2 className="w-4 h-4 animate-spin ml-auto" />
          )}
          {event.status === "completed" && (
            <CheckCircle className="w-4 h-4 ml-auto" />
          )}
          {event.status === "aborted" && (
            <CircleSlash className="w-4 h-4 ml-auto" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-zinc-500">ID:</span>
            <span className="font-mono ml-1 text-[10px]">{event.id.slice(0, 16)}...</span>
          </div>
          <div>
            <span className="text-zinc-500">Status:</span>
            <span className="ml-1 capitalize">{event.status}</span>
          </div>
          <div>
            <span className="text-zinc-500">Started:</span>
            <span className="ml-1">
              {event.startedAt ? formatTimestamp(event.startedAt) : "-"}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Duration:</span>
            <span className="ml-1">
              {formatDuration(event.startedAt, event.completedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-xs font-medium text-zinc-500 mb-1">Payload</h4>
        <pre className="text-xs bg-zinc-100 p-2 rounded overflow-x-auto">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      </div>

      {event.result && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-zinc-500 mb-1">Result</h4>
          {isComputer && event.result.type === "image" && event.result.data ? (
            <div className="mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${event.result.data}`}
                alt="Screenshot result"
                className="w-full rounded border border-zinc-200"
              />
            </div>
          ) : (
            <pre className="text-xs bg-zinc-100 p-2 rounded overflow-x-auto max-h-32">
              {JSON.stringify(event.result, null, 2)}
            </pre>
          )}
        </div>
      )}

      {isBash && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-zinc-500 mb-1">Command</h4>
          <code className="text-xs bg-zinc-900 text-zinc-100 p-2 rounded block overflow-x-auto">
            {(event as BashToolCallEvent).payload.command}
          </code>
        </div>
      )}
    </div>
  );
});

export const ToolCallDetailsPanel = memo(function ToolCallDetailsPanel() {
  const { selectedEvent, selectToolCall, eventCounts } = useEventContext();

  const handleClose = useCallback(() => selectToolCall(null), [selectToolCall]);

  if (!selectedEvent) {
    return (
      <div className="p-4 border-b border-zinc-200 bg-white">
        <h3 className="text-sm font-semibold mb-3">Tool Call Details</h3>
        <div className="text-sm text-zinc-500 text-center py-4">
          Select a tool call from the debug panel or chat to view details
        </div>
        <EventSummary eventCounts={eventCounts} />
      </div>
    );
  }

  return (
    <div className="max-h-[51vh] overflow-auto">
      <ToolCallDisplay event={selectedEvent} onClose={handleClose} />
    </div>
  );
});
