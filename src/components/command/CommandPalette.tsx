"use client";

import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useHotkeys, SHORTCUTS } from "@/components/primitives/useHotkeys";
import { useTheme } from "@/components/primitives/ThemeProvider";
import { useLayout } from "@/components/primitives/LayoutProvider";
import { Theme, Layout } from "@/types";
import {
  Sun,
  Moon,
  FileText,
  Settings,
  BookOpen,
  MessageSquare,
  StickyNote,
  Layout as LayoutIcon,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface CommandPaletteProps {
  onSendPrompt?: (prompt: string) => void;
  onGoToPage?: (page: number) => void;
}

export function CommandPalette({ onSendPrompt, onGoToPage }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { layout, setLayout } = useLayout();

  useHotkeys(SHORTCUTS.commandPalette, () => setOpen(true));

  const quickPrompts = [
    { label: "Summarize this paper", prompt: "Summarize this paper in 3-5 bullet points." },
    { label: "Explain selection", prompt: "Explain this concept simply." },
    { label: "Key arguments", prompt: "What are the key arguments in this paper?" },
    { label: "Methodology", prompt: "What methodology does this paper use?" },
    { label: "Limitations", prompt: "What are the limitations of this paper?" },
    { label: "Key figures", prompt: "Describe the key figures and tables." },
  ];

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "classic", label: "Classic (Light)", icon: <Sun className="h-4 w-4" /> },
    { value: "ink", label: "Ink (Dark)", icon: <Moon className="h-4 w-4" /> },
    { value: "paper", label: "Paper (Minimal)", icon: <FileText className="h-4 w-4" /> },
  ];

  const layouts: { value: Layout; label: string }[] = [
    { value: "sidebar-right", label: "Sidebar Right" },
    { value: "sidebar-left", label: "Sidebar Left" },
    { value: "focus", label: "Focus Mode" },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick AI Prompts */}
        {onSendPrompt && (
          <CommandGroup heading="AI Prompts">
            {quickPrompts.map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => {
                  onSendPrompt(item.prompt);
                  setOpen(false);
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Theme */}
        <CommandGroup heading="Theme">
          {themes.map((t) => (
            <CommandItem
              key={t.value}
              onSelect={() => {
                setTheme(t.value);
                setOpen(false);
              }}
            >
              {t.icon}
              <span className="ml-2">{t.label}</span>
              {theme === t.value && (
                <span className="ml-auto text-xs text-[var(--muted)]">Active</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Layout */}
        <CommandGroup heading="Layout">
          {layouts.map((l) => (
            <CommandItem
              key={l.value}
              onSelect={() => {
                setLayout(l.value);
                setOpen(false);
              }}
            >
              <LayoutIcon className="mr-2 h-4 w-4" />
              {l.label}
              {layout === l.value && (
                <span className="ml-auto text-xs text-[var(--muted)]">Active</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              window.location.href = "/";
              setOpen(false);
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Go to Library
          </CommandItem>
          <CommandItem
            onSelect={() => {
              window.location.href = "/settings";
              setOpen(false);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Help */}
        <CommandGroup heading="Help">
          <CommandItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            Keyboard Shortcuts
            <span className="ml-auto text-xs text-[var(--muted)]">⌘/</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
