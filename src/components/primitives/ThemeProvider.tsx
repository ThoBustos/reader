"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Theme } from "@/types";

const themes = {
  classic: {
    "--background": "#F2E7C9",
    "--surface": "#FAF7F0",
    "--primary": "#4E4B93",
    "--accent": "#F89151",
    "--text": "#2D2B4A",
    "--muted": "#9896B3",
    "--border": "#E5E3DE",
  },
  ink: {
    "--background": "#1A1926",
    "--surface": "#2D2B4A",
    "--primary": "#4E4B93",
    "--accent": "#F89151",
    "--text": "#F2E7C9",
    "--muted": "#6B68A8",
    "--border": "#3D3B5C",
  },
  paper: {
    "--background": "#FDFCFA",
    "--surface": "#F5F3EE",
    "--primary": "#6B68A8",
    "--accent": "#E8A87C",
    "--text": "#3D3B5C",
    "--muted": "#9896B3",
    "--border": "#E5E3DE",
  },
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "paper",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const saved = localStorage.getItem("reader-theme") as Theme | null;
    if (saved && themes[saved]) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const themeVars = themes[theme];

    Object.entries(themeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    localStorage.setItem("reader-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
