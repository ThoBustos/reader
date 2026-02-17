"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Question, Highlight } from "@/types";
import { useHotkeys, SHORTCUTS } from "@/components/primitives/useHotkeys";
import {
  FileText,
  Plus,
  Check,
  X,
  Lightbulb,
  HelpCircle,
  Quote,
  StickyNote,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface NotesPanelProps {
  paperId: string;
  currentPage: number;
  selectedText?: string;
}

interface SidecarNotes {
  summary: string;
  insights: string[];
  questions: Question[];
  highlights: Highlight[];
  notes: string;
}

export function NotesPanel({
  paperId,
  currentPage,
  selectedText,
}: NotesPanelProps) {
  const [data, setData] = useState<SidecarNotes>({
    summary: "",
    insights: [],
    questions: [],
    highlights: [],
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["insights", "questions", "highlights", "notes"])
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);

  // Load notes on mount
  useEffect(() => {
    setLoading(true);
    fetch(`/api/notes?paperId=${paperId}`)
      .then((res) => res.json())
      .then((result) => {
        setData({
          summary: result.summary || "",
          insights: result.insights || [],
          questions: result.questions || [],
          highlights: result.highlights || [],
          notes: result.notes || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load notes:", err);
        setLoading(false);
      });
  }, [paperId]);

  // Pre-fill with selected text
  useEffect(() => {
    if (selectedText) {
      setNewItem(`"${selectedText}"`);
      setEditingField("highlight");
    }
  }, [selectedText]);

  // Keyboard shortcuts
  useHotkeys(SHORTCUTS.newNote, () => {
    setEditingField("note");
  });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const saveToSection = async (section: string, content: string, page?: number) => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, section, content: content.trim(), page }),
      });

      if (!res.ok) throw new Error("Failed to save");

      // Refresh data
      const refreshRes = await fetch(`/api/notes?paperId=${paperId}`);
      const result = await refreshRes.json();
      setData({
        summary: result.summary || "",
        insights: result.insights || [],
        questions: result.questions || [],
        highlights: result.highlights || [],
        notes: result.notes || "",
      });

      setNewItem("");
      setEditingField(null);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateSummary = async () => {
    setSaving(true);
    try {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, section: "summary", content: data.summary }),
      });
      setEditingField(null);
    } catch (error) {
      console.error("Failed to update summary:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateNotes = async () => {
    setSaving(true);
    try {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, section: "notes", content: data.notes }),
      });
      setEditingField(null);
    } catch (error) {
      console.error("Failed to update notes:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--surface)] border-l border-[var(--border)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[var(--surface)] border-l border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[var(--accent)]" />
          <span className="font-medium text-[var(--text)]">Notes</span>
        </div>
        <span className="text-xs text-[var(--muted)]">Page {currentPage}</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Summary Section */}
          <Section
            title="Summary"
            icon={<StickyNote className="h-4 w-4" />}
            expanded={expandedSections.has("summary")}
            onToggle={() => toggleSection("summary")}
          >
            <Textarea
              value={data.summary}
              onChange={(e) => setData({ ...data, summary: e.target.value })}
              onBlur={updateSummary}
              placeholder="Write a 1-2 sentence summary..."
              className="min-h-[60px] resize-none bg-[var(--background)] text-[var(--text)] text-sm"
            />
          </Section>

          {/* Insights Section */}
          <Section
            title="Insights"
            icon={<Lightbulb className="h-4 w-4" />}
            count={data.insights.length}
            expanded={expandedSections.has("insights")}
            onToggle={() => toggleSection("insights")}
          >
            <div className="space-y-2">
              {data.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded bg-[var(--background)] text-sm"
                >
                  <span className="text-[var(--accent)]">•</span>
                  <span className="text-[var(--text)]">{insight}</span>
                </div>
              ))}
              {editingField === "insight" ? (
                <div className="flex gap-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add an insight..."
                    className="flex-1 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        saveToSection("insight", newItem);
                      } else if (e.key === "Escape") {
                        setEditingField(null);
                        setNewItem("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => saveToSection("insight", newItem)}
                    disabled={saving || !newItem.trim()}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingField(null);
                      setNewItem("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-[var(--muted)] text-xs"
                  onClick={() => setEditingField("insight")}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add insight
                </Button>
              )}
            </div>
          </Section>

          {/* Questions Section */}
          <Section
            title="Questions"
            icon={<HelpCircle className="h-4 w-4" />}
            count={data.questions.length}
            expanded={expandedSections.has("questions")}
            onToggle={() => toggleSection("questions")}
          >
            <div className="space-y-2">
              {data.questions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded bg-[var(--background)] text-sm"
                >
                  <span className="text-[var(--accent)] mt-0.5">
                    {q.answered ? "☑" : "☐"}
                  </span>
                  <span
                    className={`text-[var(--text)] ${q.answered ? "line-through opacity-60" : ""}`}
                  >
                    {q.text}
                  </span>
                </div>
              ))}
              {editingField === "question" ? (
                <div className="flex gap-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add a question..."
                    className="flex-1 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        saveToSection("question", newItem);
                      } else if (e.key === "Escape") {
                        setEditingField(null);
                        setNewItem("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => saveToSection("question", newItem)}
                    disabled={saving || !newItem.trim()}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingField(null);
                      setNewItem("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-[var(--muted)] text-xs"
                  onClick={() => setEditingField("question")}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add question
                </Button>
              )}
            </div>
          </Section>

          {/* Highlights Section */}
          <Section
            title="Highlights"
            icon={<Quote className="h-4 w-4" />}
            count={data.highlights.length}
            expanded={expandedSections.has("highlights")}
            onToggle={() => toggleSection("highlights")}
          >
            <div className="space-y-2">
              {data.highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-[var(--background)] text-sm border-l-2 border-[var(--accent)]"
                >
                  <blockquote className="text-[var(--text)] italic">
                    "{h.text}"
                  </blockquote>
                  {h.page && (
                    <span className="text-xs text-[var(--muted)]">p. {h.page}</span>
                  )}
                </div>
              ))}
              {editingField === "highlight" ? (
                <div className="space-y-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add a highlight..."
                    className="flex-1 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        saveToSection("highlight", newItem.replace(/^[""]|[""]$/g, ""), currentPage);
                      } else if (e.key === "Escape") {
                        setEditingField(null);
                        setNewItem("");
                      }
                    }}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      onClick={() => saveToSection("highlight", newItem.replace(/^[""]|[""]$/g, ""), currentPage)}
                      disabled={saving || !newItem.trim()}
                    >
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Save (p. {currentPage})
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingField(null);
                        setNewItem("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-[var(--muted)] text-xs"
                  onClick={() => setEditingField("highlight")}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add highlight
                </Button>
              )}
            </div>
          </Section>

          {/* Notes Section */}
          <Section
            title="Notes"
            icon={<StickyNote className="h-4 w-4" />}
            expanded={expandedSections.has("notes")}
            onToggle={() => toggleSection("notes")}
          >
            <Textarea
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              onBlur={updateNotes}
              placeholder="Free-form notes..."
              className="min-h-[100px] resize-none bg-[var(--background)] text-[var(--text)] text-sm"
            />
          </Section>
        </div>
      </ScrollArea>
    </div>
  );
}

// Collapsible section component
function Section({
  title,
  icon,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--background)] hover:bg-[var(--surface)] transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
        )}
        <span className="text-[var(--accent)]">{icon}</span>
        <span className="text-sm font-medium text-[var(--text)]">{title}</span>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {count}
          </Badge>
        )}
      </button>
      {expanded && <div className="p-3 border-t border-[var(--border)]">{children}</div>}
    </div>
  );
}
