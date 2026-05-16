"use client";

import { memo, useState, useCallback } from "react";
import { useSessionContext } from "@/lib/store";
import { Plus, Trash2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionListProps {
  onCreateSession?: () => void;
  onSwitchSession?: (id: string) => void;
}

export const SessionList = memo(function SessionList({
  onCreateSession,
  onSwitchSession,
}: SessionListProps) {
  const {
    sessions,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
  } = useSessionContext();

  const [isExpanded, setIsExpanded] = useState(true);

  const handleCreateSession = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreateSession) {
      onCreateSession();
    } else {
      createSession();
    }
  }, [onCreateSession, createSession]);

  const handleSwitchSession = useCallback((id: string) => {
    if (onSwitchSession) {
      onSwitchSession(id);
    } else {
      switchSession(id);
    }
  }, [onSwitchSession, switchSession]);

  const handleDeleteSession = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(id);
  }, [deleteSession]);

  return (
    <div className="border-b border-zinc-200 bg-white">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium">Sessions</span>
          <span className="text-xs text-zinc-500">({sessions.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateSession}
            className="p-2 hover:bg-zinc-100 rounded-lg active:bg-zinc-200 transition-colors touch-manipulation"
            title="New session"
            aria-label="Create new session"
          >
            <Plus className="w-4 h-4 text-zinc-500" />
          </button>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="max-h-48 overflow-y-auto border-t border-zinc-200">
          {sessions.length === 0 ? (
            <div className="text-xs text-zinc-400 text-center py-4">
              No sessions yet
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSwitchSession(session.id)}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 active:bg-zinc-100 transition-colors flex items-center justify-between group cursor-pointer touch-manipulation",
                  session.id === activeSessionId && "bg-zinc-100"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{session.title}</div>
                  <div className="text-xs text-zinc-400">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-zinc-200 rounded-lg active:bg-zinc-300 transition-all touch-manipulation"
                  title="Delete session"
                  aria-label="Delete session"
                >
                  <Trash2 className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});
