"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PDFViewer } from "@/components/reader/PDFViewer";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { CommandPalette } from "@/components/command/CommandPalette";
import { useLayout } from "@/components/primitives/LayoutProvider";
import { useHotkeys, SHORTCUTS } from "@/components/primitives/useHotkeys";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Paper } from "@/types";
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface ReaderPageProps {
  params: Promise<{ id: string }>;
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const { id } = use(params);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedText, setSelectedText] = useState<string | undefined>();
  const [activePanel, setActivePanel] = useState<"chat" | "notes">("chat");
  const { layout, sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const router = useRouter();

  // Fetch paper data
  useEffect(() => {
    fetch(`/api/papers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push("/");
          return;
        }
        setPaper(data);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => {
        router.push("/");
      });
  }, [id, router]);

  // Save progress when page changes
  useEffect(() => {
    if (!paper) return;

    const timeout = setTimeout(() => {
      fetch(`/api/papers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPage, totalPages }),
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [id, currentPage, totalPages, paper]);

  // Keyboard shortcuts for pass switching
  useHotkeys(SHORTCUTS.pass1, () => updatePass(1));
  useHotkeys(SHORTCUTS.pass2, () => updatePass(2));
  useHotkeys(SHORTCUTS.pass3, () => updatePass(3));
  useHotkeys(SHORTCUTS.markComplete, () => markComplete());
  useHotkeys(SHORTCUTS.toggleSidebar, () => setSidebarCollapsed(true));
  useHotkeys(SHORTCUTS.expandSidebar, () => setSidebarCollapsed(false));

  const updatePass = async (pass: 1 | 2 | 3) => {
    if (!paper) return;
    const res = await fetch(`/api/papers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass }),
    });
    const updated = await res.json();
    setPaper(updated);
  };

  const markComplete = async () => {
    if (!paper) return;
    const res = await fetch(`/api/papers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    const updated = await res.json();
    setPaper(updated);
  };

  const handleTextSelect = (text: string, page: number) => {
    setSelectedText(text);
  };

  if (loading || !paper) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted)]" />
        </div>
      </AppShell>
    );
  }

  const sidebarWidth = layout === "focus" ? "w-80" : "w-96";
  const isLeft = layout === "sidebar-left";

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="shrink-0 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Library
            </Button>
          </Link>
          <div className="h-6 w-px bg-[var(--border)]" />
          <div>
            <h1 className="text-sm font-medium text-[var(--text)] line-clamp-1 max-w-md">
              {paper.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span>
                Page {currentPage}/{totalPages}
              </span>
              <span>·</span>
              <span className="capitalize">{paper.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pass selector */}
          <Tabs
            value={String(paper.pass)}
            onValueChange={(v) => updatePass(Number(v) as 1 | 2 | 3)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="1" className="text-xs px-3">
                Pass 1
              </TabsTrigger>
              <TabsTrigger value="2" className="text-xs px-3">
                Pass 2
              </TabsTrigger>
              <TabsTrigger value="3" className="text-xs px-3">
                Pass 3
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {paper.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={markComplete}
              className="gap-1"
            >
              <Check className="h-3 w-3" />
              Complete
            </Button>
          )}

          {paper.status === "completed" && (
            <Badge className="bg-green-500">Completed</Badge>
          )}
        </div>
      </div>

        {/* Main content */}
        <div className="flex flex-1 min-h-0">
        {/* Sidebar (left or right based on layout) */}
        {!sidebarCollapsed && isLeft && (
          <div className={`flex flex-col ${sidebarWidth} shrink-0`}>
            {/* Panel tabs */}
            <div className="flex border-b border-[var(--border)] bg-[var(--surface)]">
              <button
                onClick={() => setActivePanel("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm ${
                  activePanel === "chat"
                    ? "text-[var(--text)] border-b-2 border-[var(--primary)]"
                    : "text-[var(--muted)]"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <button
                onClick={() => setActivePanel("notes")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm ${
                  activePanel === "notes"
                    ? "text-[var(--text)] border-b-2 border-[var(--primary)]"
                    : "text-[var(--muted)]"
                }`}
              >
                <FileText className="h-4 w-4" />
                Notes
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === "chat" ? (
                <ChatPanel
                  paperId={id}
                  currentPage={currentPage}
                  selectedText={selectedText}
                />
              ) : (
                <NotesPanel
                  paperId={id}
                  currentPage={currentPage}
                  currentPass={paper.pass}
                  selectedText={selectedText}
                />
              )}
            </div>
          </div>
        )}

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          <PDFViewer
            filePath={paper.filePath}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onTotalPagesChange={setTotalPages}
            onTextSelect={handleTextSelect}
          />
        </div>

        {/* Sidebar (right) */}
        {!sidebarCollapsed && !isLeft && (
          <div className={`flex flex-col ${sidebarWidth} shrink-0`}>
            {/* Panel tabs */}
            <div className="flex border-b border-[var(--border)] bg-[var(--surface)]">
              <button
                onClick={() => setActivePanel("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm ${
                  activePanel === "chat"
                    ? "text-[var(--text)] border-b-2 border-[var(--primary)]"
                    : "text-[var(--muted)]"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <button
                onClick={() => setActivePanel("notes")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm ${
                  activePanel === "notes"
                    ? "text-[var(--text)] border-b-2 border-[var(--primary)]"
                    : "text-[var(--muted)]"
                }`}
              >
                <FileText className="h-4 w-4" />
                Notes
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === "chat" ? (
                <ChatPanel
                  paperId={id}
                  currentPage={currentPage}
                  selectedText={selectedText}
                />
              ) : (
                <NotesPanel
                  paperId={id}
                  currentPage={currentPage}
                  currentPass={paper.pass}
                  selectedText={selectedText}
                />
              )}
            </div>
          </div>
        )}
        </div>

        <CommandPalette />
      </div>
    </AppShell>
  );
}
