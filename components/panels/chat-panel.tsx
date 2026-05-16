"use client";

import { memo, RefObject } from "react";
import { Menu, X, Monitor } from "lucide-react";
import { AISDKLogo } from "@/components/icons";
import { DeployButton, ProjectInfo } from "@/components/project-info";
import { SessionList } from "@/components/session-list";
import { PreviewMessage } from "@/components/message";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import { Input } from "@/components/input";
import { DebugPanel } from "@/components/debug-panel";
import type { Message } from "ai";

interface ChatPanelProps {
  messages: Message[];
  input: string;
  status: "error" | "submitted" | "streaming" | "ready";
  isInitializing: boolean;
  isLoading: boolean;
  chatContainerRef: RefObject<HTMLDivElement | null>;
  chatEndRef: RefObject<HTMLDivElement | null>;
  isMobileSidebarOpen: boolean;
  onCreateSession: () => void;
  onSwitchSession: (id: string) => void;
  onToggleMobileSidebar: () => void;
  onOpenMobileVNC: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  stop: () => void;
  append: (message: { role: "user"; content: string }) => void;
  onScreenshotClick: (imageData: string) => void;
}

export const ChatPanel = memo(function ChatPanel({
  messages,
  input,
  status,
  isInitializing,
  isLoading,
  chatContainerRef,
  chatEndRef,
  isMobileSidebarOpen,
  onCreateSession,
  onSwitchSession,
  onToggleMobileSidebar,
  onOpenMobileVNC,
  handleInputChange,
  handleSubmit,
  stop,
  append,
  onScreenshotClick,
}: ChatPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between px-2 py-2 border-b border-zinc-200 lg:hidden bg-white sticky top-0 z-10">
        <button
          onClick={onToggleMobileSidebar}
          className="flex items-center justify-center w-10 h-10 bg-zinc-100 hover:bg-zinc-200 rounded-xl active:bg-zinc-300 transition-colors touch-manipulation"
          aria-label="Toggle menu"
        >
          {isMobileSidebarOpen ? (
            <X className="w-5 h-5 text-zinc-700" />
          ) : (
            <Menu className="w-5 h-5 text-zinc-700" />
          )}
        </button>
        <AISDKLogo />
        <button
          onClick={onOpenMobileVNC}
          className="flex items-center gap-1.5 px-3 h-10 bg-blue-500 hover:bg-blue-600 rounded-xl active:bg-blue-700 transition-colors touch-manipulation"
          aria-label="Open remote desktop"
        >
          <Monitor className="w-4 h-4 text-white" />
          <span className="text-xs font-medium text-white hidden sm:inline">Desktop</span>
        </button>
      </div>

      <div className="hidden lg:flex items-center justify-between py-3 px-4 border-b border-zinc-200 bg-white">
        <AISDKLogo />
        <DeployButton />
      </div>

      <div className="flex-shrink-0">
        <SessionList
          onCreateSession={onCreateSession}
          onSwitchSession={onSwitchSession}
        />
      </div>

      <div
        className="flex-1 space-y-4 py-4 overflow-y-auto px-4 min-h-0"
        ref={chatContainerRef}
      >
        {messages.length === 0 ? <ProjectInfo /> : null}
        {messages.map((message, i) => (
          <PreviewMessage
            message={message}
            key={message.id}
            status={status}
            isLatestMessage={i === messages.length - 1}
            onScreenshotClick={onScreenshotClick}
          />
        ))}
        <div ref={chatEndRef} className="pb-2" />
      </div>

      {messages.length === 0 && (
        <div className="flex-shrink-0">
          <PromptSuggestions
            disabled={isInitializing}
            submitPrompt={(prompt: string) =>
              append({ role: "user", content: prompt })
            }
          />
        </div>
      )}
      
      <div className="flex-shrink-0 bg-white border-t border-zinc-200">
        <form onSubmit={handleSubmit} className="p-3">
          <Input
            handleInputChange={handleInputChange}
            input={input}
            isInitializing={isInitializing}
            isLoading={isLoading}
            status={status}
            stop={stop}
          />
        </form>
      </div>

      <div className="flex-shrink-0">
        <DebugPanel />
      </div>
    </div>
  );
});
