"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PaperNote } from "@/types";
import { useHotkeys, SHORTCUTS } from "@/components/primitives/useHotkeys";
import {
  FileText,
  Plus,
  Save,
  Check,
  X,
  Tag,
  BookOpen,
  Loader2,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface NotesPanelProps {
  paperId: string;
  currentPage: number;
  currentPass: 1 | 2 | 3;
  selectedText?: string;
}

export function NotesPanel({
  paperId,
  currentPage,
  currentPass,
  selectedText,
}: NotesPanelProps) {
  const [notes, setNotes] = useState<PaperNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // Load notes on mount
  useEffect(() => {
    fetch(`/api/notes?paperId=${paperId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notes) {
          setNotes(data.notes);
        }
      })
      .catch(console.error);
  }, [paperId]);

  // Pre-fill note with selected text
  useEffect(() => {
    if (selectedText) {
      setNewNote(`> "${selectedText}"\n\n`);
    }
  }, [selectedText]);

  // Keyboard shortcuts
  useHotkeys(SHORTCUTS.newNote, () => {
    const textarea = document.querySelector(
      'textarea[placeholder*="note"]'
    ) as HTMLTextAreaElement;
    textarea?.focus();
  });

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;

    const note: PaperNote = {
      id: uuidv4(),
      paperId,
      content: newNote.trim(),
      page: currentPage,
      selection: selectedText,
      tags,
      createdAt: new Date().toISOString(),
      pass: currentPass,
    };

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, note }),
      });

      if (!res.ok) throw new Error("Failed to save note");

      setNotes([...notes, note]);
      setNewNote("");
      setTags([]);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Save note error:", error);
      setSaveStatus("error");
    }
  };

  const saveToVault = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save to vault");
      }

      const data = await res.json();
      alert(`Saved to vault: ${data.path}`);
    } catch (error) {
      console.error("Save to vault error:", error);
      alert(error instanceof Error ? error.message : "Failed to save to vault");
    } finally {
      setIsSaving(false);
    }
  };

  const passNotes = notes.filter((n) => n.pass === currentPass);
  const otherNotes = notes.filter((n) => n.pass !== currentPass);

  return (
    <div className="flex h-full flex-col bg-[var(--surface)] border-l border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[var(--accent)]" />
          <span className="font-medium text-[var(--text)]">Notes</span>
          <Badge variant="outline" className="text-xs">
            Pass {currentPass}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={saveToVault}
          disabled={isSaving}
          className="gap-1 text-xs"
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Save to Vault
        </Button>
      </div>

      {/* Note input */}
      <div className="border-b border-[var(--border)] p-4">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note... (quotes start with >, questions with ?)"
          className="min-h-[80px] resize-none bg-[var(--background)] text-[var(--text)] text-sm"
        />

        {/* Tags */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Tag className="h-3 w-3 text-[var(--muted)]" />
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 text-xs cursor-pointer"
              onClick={() => removeTag(tag)}
            >
              {tag}
              <X className="h-2 w-2" />
            </Badge>
          ))}
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag..."
            className="h-6 w-20 text-xs"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">
            Page {currentPage} · Pass {currentPass}
          </span>
          <Button
            size="sm"
            onClick={saveNote}
            disabled={!newNote.trim()}
            className="gap-1 bg-[var(--primary)]"
          >
            {saveStatus === "saved" ? (
              <Check className="h-3 w-3" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Add Note
          </Button>
        </div>
      </div>

      {/* Notes list */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4">
          {/* Current pass notes */}
          {passNotes.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-medium text-[var(--muted)] uppercase">
                Pass {currentPass} Notes
              </h3>
              <div className="space-y-2">
                {passNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}

          {/* Other notes */}
          {otherNotes.length > 0 && (
            <div>
              <Separator className="my-4" />
              <h3 className="mb-2 text-xs font-medium text-[var(--muted)] uppercase">
                Other Notes
              </h3>
              <div className="space-y-2">
                {otherNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}

          {notes.length === 0 && (
            <div className="text-center text-sm text-[var(--muted)]">
              No notes yet. Start taking notes as you read!
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function NoteCard({ note }: { note: PaperNote }) {
  const isQuote =
    note.content.startsWith(">") || note.content.startsWith('"');
  const isQuestion = note.content.startsWith("?");

  return (
    <div
      className={`rounded-lg p-3 text-sm ${
        isQuote
          ? "border-l-2 border-[var(--accent)] bg-[var(--background)]"
          : isQuestion
            ? "border-l-2 border-[var(--primary)] bg-[var(--background)]"
            : "bg-[var(--background)]"
      }`}
    >
      <div className="whitespace-pre-wrap text-[var(--text)]">
        {note.content}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
        {note.page && (
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            p. {note.page}
          </span>
        )}
        <span>Pass {note.pass}</span>
        {note.tags.length > 0 && (
          <div className="flex gap-1">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
