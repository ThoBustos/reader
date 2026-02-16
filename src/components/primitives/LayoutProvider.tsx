"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Layout } from "@/types";

interface LayoutContextValue {
  layout: Layout;
  setLayout: (layout: Layout) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export function LayoutProvider({
  children,
  defaultLayout = "sidebar-right",
}: {
  children: ReactNode;
  defaultLayout?: Layout;
}) {
  const [layout, setLayout] = useState<Layout>(defaultLayout);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("reader-layout") as Layout | null;
    if (saved) {
      setLayout(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("reader-layout", layout);
  }, [layout]);

  return (
    <LayoutContext.Provider
      value={{ layout, setLayout, sidebarCollapsed, setSidebarCollapsed }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
