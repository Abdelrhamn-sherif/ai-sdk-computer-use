"use client";

import { memo } from "react";
import { X } from "lucide-react";
import { VNCViewer } from "@/components/vnc-viewer";
import { ToolCallDetailsPanel } from "@/components/tool-call-details";

interface ExpandedScreenshotProps {
  imageData: string;
  onClose: () => void;
}

const ExpandedScreenshot = memo(function ExpandedScreenshot({
  imageData,
  onClose,
}: ExpandedScreenshotProps) {
  return (
    <div className="p-4 border-b border-zinc-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Expanded Screenshot</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-100 rounded-lg active:bg-zinc-200 transition-colors touch-manipulation"
          aria-label="Close expanded screenshot"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${imageData}`}
        alt="Expanded screenshot"
        className="w-full rounded-lg border border-zinc-200"
      />
    </div>
  );
});

interface RightPanelProps {
  streamUrl: string | null;
  isInitializing: boolean;
  expandedScreenshot: string | null;
  onRefresh: () => void;
  onClearScreenshot: () => void;
}

export const RightPanel = memo(function RightPanel({
  streamUrl,
  isInitializing,
  expandedScreenshot,
  onRefresh,
  onClearScreenshot,
}: RightPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <VNCViewer
          streamUrl={streamUrl}
          isInitializing={isInitializing}
          onRefresh={onRefresh}
        />
      </div>
      <div className="flex-shrink-0">
        {expandedScreenshot ? (
          <ExpandedScreenshot
            imageData={expandedScreenshot}
            onClose={onClearScreenshot}
          />
        ) : (
          <ToolCallDetailsPanel />
        )}
      </div>
    </div>
  );
});
