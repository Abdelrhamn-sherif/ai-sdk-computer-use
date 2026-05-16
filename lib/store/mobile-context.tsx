"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

interface MobileUIContextValue {
  isMobileSidebarOpen: boolean;
  isMobileVNCOpen: boolean;
  toggleMobileSidebar: () => void;
  setMobileVNCOpen: (open: boolean) => void;
}

const MobileUIContext = createContext<MobileUIContextValue | null>(null);

export function MobileUIProvider({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileVNCOpen, setIsMobileVNCOpen] = useState(false);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const setMobileVNCOpenCallback = useCallback((open: boolean) => {
    setIsMobileVNCOpen(open);
  }, []);

  const value = useMemo<MobileUIContextValue>(
    () => ({
      isMobileSidebarOpen,
      isMobileVNCOpen,
      toggleMobileSidebar,
      setMobileVNCOpen: setMobileVNCOpenCallback,
    }),
    [isMobileSidebarOpen, isMobileVNCOpen, toggleMobileSidebar, setMobileVNCOpenCallback]
  );

  return (
    <MobileUIContext.Provider value={value}>
      {children}
    </MobileUIContext.Provider>
  );
}

export function useMobileUI(): MobileUIContextValue {
  const context = useContext(MobileUIContext);
  if (!context) {
    throw new Error("useMobileUI must be used within a MobileUIProvider");
  }
  return context;
}
