"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/primitives/ThemeProvider";
import { useLayout } from "@/components/primitives/LayoutProvider";
import { Settings, Theme, Layout, LLMProvider } from "@/types";
import {
  Palette,
  Layout as LayoutIcon,
  Sparkles,
  FolderOpen,
  Keyboard,
  Save,
  Check,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();
  const { layout, setLayout } = useLayout();

  // Form state
  const [vaultPath, setVaultPath] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [llmProvider, setLlmProvider] = useState<LLMProvider>("gemini");

  // Load settings
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setVaultPath(data.vaultPath || "");
        setLlmProvider(data.llmProvider || "gemini");
      })
      .catch(console.error);
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const body: Partial<Settings> = {
        theme,
        layout,
        llmProvider,
        vaultPath,
      };

      // Only include API keys if they were changed (not masked)
      if (geminiApiKey && !geminiApiKey.includes("***")) {
        body.geminiApiKey = geminiApiKey;
      }
      if (claudeApiKey && !claudeApiKey.includes("***")) {
        body.claudeApiKey = claudeApiKey;
      }

      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const shortcuts = [
    { category: "Navigation", items: [
      { key: "j / k", action: "Next / Previous page" },
      { key: "g g", action: "Go to first page" },
      { key: "G", action: "Go to last page" },
      { key: "h / l", action: "Collapse / Expand sidebar" },
    ]},
    { category: "Command Palette", items: [
      { key: "⌘ K", action: "Open command palette" },
      { key: "⌘ P", action: "Quick open paper" },
      { key: "⌘ /", action: "Toggle shortcuts help" },
    ]},
    { category: "AI Chat", items: [
      { key: "⌘ J", action: "Focus chat input" },
      { key: "⌘ Enter", action: "Send message" },
      { key: "c", action: "Toggle context mode" },
    ]},
    { category: "Notes", items: [
      { key: "n", action: "New note from selection" },
      { key: "⌘ S", action: "Save note to vault" },
    ]},
    { category: "Reading", items: [
      { key: "1 / 2 / 3", action: "Switch to Pass 1/2/3" },
      { key: "m", action: "Mark paper complete" },
      { key: "z", action: "Toggle zen mode" },
    ]},
  ];

  return (
    <AppShell>
      <div className="h-full overflow-auto bg-[var(--background)]">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <h1 className="text-2xl font-bold text-[var(--text)]">Settings</h1>
          <p className="mt-2 text-[var(--muted)]">
            Configure your reading environment and integrations.
          </p>

          <div className="mt-8 space-y-6">
            {/* Appearance */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--text)]">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of Reader.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text)]">
                    Theme
                  </label>
                  <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paper">Paper (Ultra Minimal)</SelectItem>
                      <SelectItem value="classic">Classic (Light)</SelectItem>
                      <SelectItem value="ink">Ink (Dark)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text)]">
                    Layout
                  </label>
                  <Select value={layout} onValueChange={(v) => setLayout(v as Layout)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sidebar-right">Sidebar Right</SelectItem>
                      <SelectItem value="sidebar-left">Sidebar Left</SelectItem>
                      <SelectItem value="focus">Focus Mode (Narrow Sidebar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* LLM Provider */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--text)]">
                  <Sparkles className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Configure your preferred AI provider for paper analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text)]">
                    Provider
                  </label>
                  <Select
                    value={llmProvider}
                    onValueChange={(v) => setLlmProvider(v as LLMProvider)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">
                        <div className="flex items-center gap-2">
                          Gemini 2 Flash
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="claude">Claude Sonnet</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {llmProvider === "gemini"
                      ? "Gemini can see the full PDF including figures and tables."
                      : "Claude uses extracted text from the PDF."}
                  </p>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-[var(--text)]">
                    Gemini API Key
                  </label>
                  <Input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Get your key from{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary)] underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text)]">
                    Claude API Key
                  </label>
                  <Input
                    type="password"
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Get your key from{" "}
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary)] underline"
                    >
                      Anthropic Console
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Vault Integration */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--text)]">
                  <FolderOpen className="h-5 w-5" />
                  Obsidian Vault
                </CardTitle>
                <CardDescription>
                  Connect to your Obsidian vault to save structured notes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium text-[var(--text)]">
                    Vault Path
                  </label>
                  <Input
                    value={vaultPath}
                    onChange={(e) => setVaultPath(e.target.value)}
                    placeholder="/Users/you/Documents/my-vault"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Full path to your Obsidian vault. Notes will be saved to
                    06_READING/.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--text)]">
                  <Keyboard className="h-5 w-5" />
                  Keyboard Shortcuts
                </CardTitle>
                <CardDescription>
                  Quick reference for keyboard shortcuts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shortcuts.map((group) => (
                    <div key={group.category}>
                      <h4 className="text-sm font-medium text-[var(--text)] mb-2">
                        {group.category}
                      </h4>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-[var(--muted)]">{item.action}</span>
                            <kbd className="rounded bg-[var(--background)] px-2 py-0.5 text-xs font-mono text-[var(--text)]">
                              {item.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Save button */}
            <div className="flex justify-end">
              <Button
                onClick={saveSettings}
                disabled={isSaving}
                className="gap-2 bg-[var(--primary)]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saved ? "Saved!" : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
