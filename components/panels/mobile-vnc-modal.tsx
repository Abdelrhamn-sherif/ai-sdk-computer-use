"use client";

import { memo } from "react";
import { X, MessageSquare } from "lucide-react";
import { VNCViewer } from "@/components/vnc-viewer";

interface MobileVNCModalProps {
  isOpen: boolean;
  streamUrl: string | null;
  isInitializing: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const MobileVNCModal = memo(function MobileVNCModal({
  isOpen,
  streamUrl,
  isInitializing,
  onClose,
  onRefresh,
}: MobileVNCModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black flex flex-col">
        <div className="flex items-center justify-between p-3 bg-zinc-900">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 rounded-lg hover:bg-zinc-100 active:bg-zinc-200 transition-colors touch-manipulation font-medium"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Back to Chat</span>
          </button>
          <button
            onClick={onClose}
            className="p-3 hover:bg-zinc-800 rounded-lg active:bg-zinc-700 touch-manipulation"
            aria-label="Close remote desktop"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <VNCViewer
            streamUrl={streamUrl}
            isInitializing={isInitializing}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </div>
  );
});
