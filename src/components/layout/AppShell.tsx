"use client";

import { ReactNode } from "react";
import { useLayout } from "@/components/primitives/LayoutProvider";
import { useTheme } from "@/components/primitives/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import {
  Library,
  Settings,
  Sun,
  Moon,
  FileText,
  HelpCircle,
  BrainCircuit,
} from "lucide-react";

interface AppShellProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();

  const themeIcon = {
    classic: <Sun className="h-4 w-4" />,
    ink: <Moon className="h-4 w-4" />,
    paper: <FileText className="h-4 w-4" />,
  };

  const nextTheme = {
    classic: "ink" as const,
    ink: "paper" as const,
    paper: "classic" as const,
  };

  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Sidebar navigation */}
      {showNav && (
        <nav className="flex w-14 flex-col items-center border-r border-[var(--border)] bg-[var(--surface)] py-4">
          <Link href="/" className="mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
              <img src="/logo.png" alt="Reader" className="h-10 w-10 object-contain" />
            </div>
          </Link>

          <div className="flex flex-1 flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <Button variant="ghost" size="icon" className="text-[var(--muted)] hover:text-[var(--text)]">
                    <Library className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Library</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/quizzes">
                  <Button variant="ghost" size="icon" className="text-[var(--muted)] hover:text-[var(--text)]">
                    <BrainCircuit className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Quizzes</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/guide">
                  <Button variant="ghost" size="icon" className="text-[var(--muted)] hover:text-[var(--text)]">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Guide</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(nextTheme[theme])}
                  className="text-[var(--muted)] hover:text-[var(--text)]"
                >
                  {themeIcon[theme]}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="text-[var(--muted)] hover:text-[var(--text)]">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </div>
        </nav>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
