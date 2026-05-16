"use client";

import type { Message } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { memo, useEffect, useCallback } from "react";
import equal from "fast-deep-equal";
import { Streamdown } from "streamdown";

import { ABORTED, cn } from "@/lib/utils";
import { useEventContext } from "@/lib/store";
import type { ComputerAction, ComputerToolCallEvent, BashToolCallEvent } from "@/lib/store";
import {
  Camera,
  CheckCircle,
  CircleSlash,
  Clock,
  Keyboard,
  KeyRound,
  Loader2,
  MousePointer,
  MousePointerClick,
  ScrollText,
  StopCircle,
  Expand,
} from "lucide-react";
import { useRef } from "react";

interface PreviewMessageProps {
  message: Message;
  isLatestMessage: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
  onScreenshotClick?: (imageData: string) => void;
}

const ACTION_ICONS: Record<ComputerAction, React.ComponentType<{ className?: string }>> = {
  screenshot: Camera,
  left_click: MousePointer,
  right_click: MousePointerClick,
  double_click: MousePointerClick,
  mouse_move: MousePointer,
  type: Keyboard,
  key: KeyRound,
  wait: Clock,
  scroll: ScrollText,
};

const ACTION_LABELS: Record<ComputerAction, string> = {
  screenshot: "Taking screenshot",
  left_click: "Left clicking",
  right_click: "Right clicking",
  double_click: "Double clicking",
  mouse_move: "Moving mouse",
  type: "Typing",
  key: "Pressing key",
  wait: "Waiting",
  scroll: "Scrolling",
};

function getActionDetail(action: ComputerAction, args: Record<string, unknown>): string {
  const { coordinate, text, duration, scroll_direction, scroll_amount } = args;
  
  switch (action) {
    case "left_click":
    case "right_click":
    case "double_click":
    case "mouse_move":
      return coordinate ? `at (${(coordinate as [number, number])[0]}, ${(coordinate as [number, number])[1]})` : "";
    case "type":
    case "key":
      return text ? `"${text}"` : "";
    case "wait":
      return duration ? `${duration} seconds` : "";
    case "scroll":
      return scroll_direction && scroll_amount ? `${scroll_direction} by ${scroll_amount}` : "";
    default:
      return "";
  }
}

function PreviewMessageInner({
  message,
  isLatestMessage,
  status,
  onScreenshotClick,
}: PreviewMessageProps) {
  const { addEvent, selectEvent, selectedEventId } = useEventContext();
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    message.parts?.forEach((part) => {
      if (part.type !== "tool-invocation") return;
      
      const { toolName, toolCallId, state, args } = part.toolInvocation;
      const eventKey = `${toolCallId}-${state}`;
      if (processedRef.current.has(eventKey)) return;
      if (toolName !== "computer" && toolName !== "bash") return;
      
      processedRef.current.add(eventKey);
      const result = state === "result" ? part.toolInvocation.result : undefined;
      const now = Date.now();

      if (toolName === "computer") {
        addEvent({
          type: "computer_tool",
          toolCallId,
          action: args.action as ComputerAction,
          status: state === "call" ? "running" : "completed",
          payload: {
            coordinate: args.coordinate as [number, number] | undefined,
            text: args.text as string | undefined,
            duration: args.duration as number | undefined,
            scroll_direction: args.scroll_direction as "up" | "down" | undefined,
            scroll_amount: args.scroll_amount as number | undefined,
          },
          duration: null,
          startedAt: state === "call" ? now : null,
          completedAt: state === "result" ? now : null,
          result: result as ComputerToolCallEvent["result"],
        } as Omit<ComputerToolCallEvent, "id" | "timestamp">);
      } else {
        addEvent({
          type: "bash_tool",
          toolCallId,
          status: state === "call" ? "running" : "completed",
          payload: { command: args.command as string },
          duration: null,
          startedAt: state === "call" ? now : null,
          completedAt: state === "result" ? now : null,
          result: result as BashToolCallEvent["result"],
        } as Omit<BashToolCallEvent, "id" | "timestamp">);
      }
    });
  }, [message.parts, message.id, addEvent]);

  const handleSelect = useCallback((id: string) => selectEvent(id), [selectEvent]);

  return (
    <AnimatePresence key={message.id}>
      <motion.div
        className="w-full mx-auto px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            "group-data-[role=user]/message:w-fit"
          )}
        >
          <div className="flex flex-col w-full">
            {message.parts?.map((part, i) => {
              if (part.type === "text") {
                return (
                  <motion.div
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    key={`${message.id}-text-${i}`}
                    className={cn("pb-4", message.role === "user" && "bg-secondary text-secondary-foreground px-3 py-2 rounded-xl")}
                  >
                    <Streamdown>{part.text}</Streamdown>
                  </motion.div>
                );
              }

              if (part.type === "tool-invocation") {
                const { toolName, toolCallId, state, args } = part.toolInvocation;
                const result = state === "result" ? part.toolInvocation.result : undefined;

                if (toolName === "computer") {
                  const action = args.action as ComputerAction;
                  const ActionIcon = ACTION_ICONS[action];
                  const imageData = result && typeof result === "object" && result !== null && "data" in result
                    ? (result as { data?: string }).data
                    : undefined;

                  return (
                    <motion.div
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={`${message.id}-tool-${toolCallId}`}
                      onClick={() => handleSelect(toolCallId)}
                      className={cn(
                        "flex flex-col gap-2 p-2 mb-3 text-sm bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-400 transition-colors",
                        selectedEventId === toolCallId && "ring-1 ring-zinc-500"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full shrink-0">
                          <ActionIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium font-mono">{ACTION_LABELS[action]}</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                            {getActionDetail(action, args)}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {state === "call" && isLatestMessage && status !== "ready" ? (
                            <Loader2 className="animate-spin h-4 w-4 text-zinc-500" />
                          ) : state === "call" ? (
                            <StopCircle className="h-4 w-4 text-red-500" />
                          ) : result === ABORTED ? (
                            <CircleSlash size={14} className="text-amber-600" />
                          ) : (
                            <CheckCircle size={14} className="text-green-600" />
                          )}
                        </div>
                      </div>
                      
                      {state === "result" && imageData ? (
                        <div className="p-2 relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`data:image/png;base64,${imageData}`}
                            alt="Screenshot"
                            className="w-full aspect-[1024/768] rounded-sm"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onScreenshotClick?.(imageData);
                            }}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Expand className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : action === "screenshot" && state === "call" ? (
                        <div className="w-full aspect-[1024/768] rounded-sm bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                      ) : null}
                    </motion.div>
                  );
                }

                if (toolName === "bash") {
                  const command = (args.command as string) || "";
                  const truncated = command.length > 40 ? `${command.slice(0, 40)}...` : command;

                  return (
                    <motion.div
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={`${message.id}-tool-${toolCallId}`}
                      onClick={() => handleSelect(toolCallId)}
                      className={cn(
                        "flex items-center gap-2 p-2 mb-3 text-sm bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-400 transition-colors",
                        selectedEventId === toolCallId && "ring-1 ring-zinc-500"
                      )}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full shrink-0">
                        <ScrollText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">Running command</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">{truncated}</span>
                      </div>
                      <div className="shrink-0">
                        {state === "call" && isLatestMessage && status !== "ready" ? (
                          <Loader2 className="animate-spin h-4 w-4 text-zinc-500" />
                        ) : state === "call" ? (
                          <StopCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle size={14} className="text-green-600" />
                        )}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <div key={`${message.id}-unknown-${i}`} className="p-2 mb-3 text-sm bg-zinc-50 rounded-md border">
                    {toolName}: {state}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export const PreviewMessage = memo(PreviewMessageInner, (prev, next) => {
  if (prev.status !== next.status) return false;
  if (prev.isLatestMessage !== next.isLatestMessage) return false;
  if (!equal(prev.message.parts, next.message.parts)) return false;
  return true;
});
