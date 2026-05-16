"use client";

import { memo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AISDKLogo } from "@/components/icons";
import type { ChatSession } from "@/lib/store";

interface MobileSidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onClose: () => void;
  onCreateSession: () => void;
  onSwitchSession: (id: string) => void;
}

export const MobileSidebar = memo(function MobileSidebar({
  isOpen,
  sessions,
  activeSessionId,
  onClose,
  onCreateSession,
  onSwitchSession,
}: MobileSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <AISDKLogo />
          <button
            onClick={onClose}
            className="p-3 hover:bg-zinc-100 rounded-lg active:bg-zinc-200 touch-manipulation"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {sessions.length === 0 ? (
            <div className="text-sm text-zinc-500 text-center py-8">
              No sessions yet
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    onSwitchSession(session.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm rounded-lg transition-colors touch-manipulation",
                    session.id === activeSessionId
                      ? "bg-zinc-100 font-medium"
                      : "hover:bg-zinc-50 active:bg-zinc-100"
                  )}
                >
                  <div className="truncate">{session.title}</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              onCreateSession();
              onClose();
            }}
            className="mt-4 w-full px-4 py-3 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 active:bg-zinc-700 transition-colors touch-manipulation"
          >
            New Session
          </button>
        </div>
      </div>
    </div>
  );
});
