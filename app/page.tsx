"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { EventProvider, SessionProvider, useEventContext, useSessionContext } from "@/lib/store";
import { useSandbox, useChatSession } from "@/lib/hooks";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { ChatPanel, RightPanel, MobileSidebar, MobileVNCModal } from "@/components/panels";

function LoadingSpinner() {
  return (
    <div className="flex h-dvh items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-zinc-200 rounded-full" />
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <span className="text-sm text-zinc-500">Loading...</span>
      </div>
    </div>
  );
}

function DashboardContent() {
  const [chatContainerRef, chatEndRef] = useScrollToBottom();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileVNCOpen, setIsMobileVNCOpen] = useState(false);
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);

  const {
    sessions,
    activeSessionId,
    activeSession,
    isHydrated,
    createSession,
    switchSession,
    updateSessionMessages,
    updateSessionSandboxId,
  } = useSessionContext();

  const { clearEvents, setActiveSession, isHydrated: isEventHydrated } = useEventContext();

  const { isInitializing, streamUrl, refreshDesktop } = useSandbox({
    activeSessionId,
    updateSessionSandboxId,
  });

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    isLoading,
    stop,
    append,
    resetMessages,
    chatKey,
  } = useChatSession({
    activeSessionId,
    activeSession,
    sandboxId: null,
    createSession,
    updateSessionMessages,
    setActiveSession,
  });

  const handleCreateSession = useCallback(() => {
    clearEvents();
    createSession();
    resetMessages([]);
  }, [clearEvents, createSession, resetMessages]);

  const handleSwitchSession = useCallback(
    (id: string) => {
      if (id === activeSessionId) return;
      
      setActiveSession(id);
      switchSession(id);
      const session = sessions.find((s) => s.id === id);
      resetMessages(session?.messages ?? []);
    },
    [setActiveSession, switchSession, sessions, activeSessionId, resetMessages]
  );

  useEffect(() => {
    if (isHydrated && isEventHydrated && activeSessionId) {
      setActiveSession(activeSessionId);
    }
  }, [isHydrated, isEventHydrated, activeSessionId, setActiveSession]);

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-dvh relative">
      <div className="hidden lg:flex h-full w-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel
            defaultSize={50}
            minSize={30}
            className="flex flex-col border-r border-zinc-200 bg-white"
          >
            <ChatPanel
              key={chatKey}
              messages={messages}
              input={input}
              status={status}
              isInitializing={isInitializing}
              isLoading={isLoading}
              chatContainerRef={chatContainerRef}
              chatEndRef={chatEndRef}
              isMobileSidebarOpen={isMobileSidebarOpen}
              onCreateSession={handleCreateSession}
              onSwitchSession={handleSwitchSession}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              onOpenMobileVNC={() => setIsMobileVNCOpen(true)}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              stop={stop}
              append={append}
              onScreenshotClick={setExpandedScreenshot}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col">
            <RightPanel
              streamUrl={streamUrl}
              isInitializing={isInitializing}
              expandedScreenshot={expandedScreenshot}
              onRefresh={refreshDesktop}
              onClearScreenshot={() => setExpandedScreenshot(null)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="lg:hidden h-full w-full flex flex-col border-r border-zinc-200 bg-white">
        <ChatPanel
          key={`mobile-${chatKey}`}
          messages={messages}
          input={input}
          status={status}
          isInitializing={isInitializing}
          isLoading={isLoading}
          chatContainerRef={chatContainerRef}
          chatEndRef={chatEndRef}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onCreateSession={handleCreateSession}
          onSwitchSession={handleSwitchSession}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenMobileVNC={() => setIsMobileVNCOpen(true)}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          stop={stop}
          append={append}
          onScreenshotClick={setExpandedScreenshot}
        />
      </div>

      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onClose={() => setIsMobileSidebarOpen(false)}
        onCreateSession={handleCreateSession}
        onSwitchSession={handleSwitchSession}
      />

      <MobileVNCModal
        isOpen={isMobileVNCOpen}
        streamUrl={streamUrl}
        isInitializing={isInitializing}
        onClose={() => setIsMobileVNCOpen(false)}
        onRefresh={refreshDesktop}
      />
    </div>
  );
}

export default function Chat() {
  return (
    <SessionProvider>
      <EventProvider>
        <DashboardContent />
      </EventProvider>
    </SessionProvider>
  );
}
