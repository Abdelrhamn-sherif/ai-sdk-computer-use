"use client";

import { useState, useCallback, useEffect } from "react";
import { getDesktopURL } from "@/lib/sandbox/utils";
import { toast } from "sonner";

interface UseSandboxState {
  isInitializing: boolean;
  streamUrl: string | null;
  sandboxId: string | null;
  refreshDesktop: () => Promise<void>;
}

interface UseSandboxOptions {
  activeSessionId: string | null;
  updateSessionSandboxId: (id: string, sandboxId: string) => void;
}

export function useSandbox({
  activeSessionId,
  updateSessionSandboxId,
}: UseSandboxOptions): UseSandboxState {
  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  const refreshDesktop = useCallback(async () => {
    try {
      setIsInitializing(true);
      const { streamUrl: url, id } = await getDesktopURL(sandboxId || undefined);
      setStreamUrl(url);
      setSandboxId(id);
      if (activeSessionId) {
        updateSessionSandboxId(activeSessionId, id);
      }
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
    } finally {
      setIsInitializing(false);
    }
  }, [sandboxId, activeSessionId, updateSessionSandboxId]);

  useEffect(() => {
    if (!sandboxId) return;

    const killDesktop = () => {
      if (!sandboxId) return;
      navigator.sendBeacon(
        `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`
      );
    };

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      window.addEventListener("pagehide", killDesktop);
      return () => {
        window.removeEventListener("pagehide", killDesktop);
        killDesktop();
      };
    } else {
      window.addEventListener("beforeunload", killDesktop);
      return () => {
        window.removeEventListener("beforeunload", killDesktop);
        killDesktop();
      };
    }
  }, [sandboxId]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        const { streamUrl: url, id } = await getDesktopURL(sandboxId ?? undefined);
        setStreamUrl(url);
        setSandboxId(id);
      } catch (err) {
        console.error("Failed to initialize desktop:", err);
        toast.error("Failed to initialize desktop");
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  return { isInitializing, streamUrl, sandboxId, refreshDesktop };
}
