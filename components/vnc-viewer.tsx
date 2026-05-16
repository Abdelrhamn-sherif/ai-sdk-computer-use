"use client";

import { memo, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { RefreshCw, Maximize2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface VNCViewerProps {
  streamUrl: string | null;
  isInitializing: boolean;
  onRefresh: () => void;
  isMobileExpanded?: boolean;
  onToggleMobileExpand?: () => void;
}

function ModernLoader() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 border-4 border-zinc-700 rounded-full" />
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <span className="text-sm text-zinc-400">Loading...</span>
    </div>
  );
}

interface VNCFrameProps {
  streamUrl: string;
}

const VNCFrame = memo(function VNCFrame({ streamUrl }: VNCFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <iframe
      ref={iframeRef}
      src={streamUrl}
      className="w-full h-full"
      style={{
        transformOrigin: "center",
        width: "100%",
        height: "100%",
      }}
      allow="autoplay"
      title="VNC Remote Desktop"
    />
  );
}, (prevProps, nextProps) => prevProps.streamUrl === nextProps.streamUrl);

interface VNCControlsProps {
  isInitializing: boolean;
  onRefresh: () => void;
  showMobileToggle?: boolean;
  isMobileExpanded?: boolean;
  onToggleMobileExpand?: () => void;
}

const VNCControls = memo(function VNCControls({
  isInitializing,
  onRefresh,
  showMobileToggle,
  isMobileExpanded,
  onToggleMobileExpand,
}: VNCControlsProps) {
  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  const handleToggleExpand = useCallback(() => {
    onToggleMobileExpand?.();
  }, [onToggleMobileExpand]);

  return (
    <div className="absolute top-2 right-2 flex gap-2 z-10">
      {showMobileToggle && isMobileExpanded && (
        <Button
          onClick={handleToggleExpand}
          className="bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
        >
          <MessageSquare className="w-3 h-3" />
          Chat
        </Button>
      )}
      {showMobileToggle && !isMobileExpanded && (
        <Button
          onClick={handleToggleExpand}
          className="bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded text-sm"
        >
          <Maximize2 className="w-3 h-3" />
        </Button>
      )}
      <Button
        onClick={handleRefresh}
        className="bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded text-sm"
        disabled={isInitializing}
      >
        {isInitializing ? (
          <>
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <RefreshCw className="w-3 h-3 mr-1" />
            New Desktop
          </>
        )}
      </Button>
    </div>
  );
});

function VNCViewerComponent({
  streamUrl,
  isInitializing,
  onRefresh,
  isMobileExpanded,
  onToggleMobileExpand,
}: VNCViewerProps) {
  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <div className={cn(
      "w-full h-full bg-black relative flex items-center justify-center",
      isMobileExpanded && "fixed inset-0 z-50"
    )}>
      {streamUrl ? (
        <>
          <VNCFrame streamUrl={streamUrl} />
          <VNCControls
            isInitializing={isInitializing}
            onRefresh={handleRefresh}
            showMobileToggle={!!onToggleMobileExpand}
            isMobileExpanded={isMobileExpanded}
            onToggleMobileExpand={onToggleMobileExpand}
          />
        </>
      ) : (
        <ModernLoader />
      )}
    </div>
  );
}

export const VNCViewer = memo(VNCViewerComponent, (prevProps, nextProps) => {
  return (
    prevProps.streamUrl === nextProps.streamUrl &&
    prevProps.isInitializing === nextProps.isInitializing &&
    prevProps.isMobileExpanded === nextProps.isMobileExpanded &&
    prevProps.onToggleMobileExpand === nextProps.onToggleMobileExpand
  );
});
