"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Paper } from "@/types";
import { useHotkeys, SHORTCUTS } from "@/components/primitives/useHotkeys";
import {
  Plus,
  Search,
  BookOpen,
  CheckCircle,
  MoreVertical,
  Trash2,
  FileText,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LibraryViewProps {
  initialPapers?: Paper[];
}

export function LibraryView({ initialPapers = [] }: LibraryViewProps) {
  const [papers, setPapers] = useState<Paper[]>(initialPapers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "reading" | "done">("all");
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  // Fetch papers on mount
  useEffect(() => {
    fetch("/api/papers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPapers(data);
        }
      })
      .catch(console.error);
  }, []);

  // Keyboard shortcuts
  useHotkeys(SHORTCUTS.search, () => {
    const input = document.querySelector(
      'input[placeholder*="Search"]'
    ) as HTMLInputElement;
    input?.focus();
  });

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload file
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || "Upload failed");
      }

      const { filePath, originalName } = await uploadRes.json();

      // Create paper entry
      const paperRes = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePath: filePath,
          title: originalName.replace(/\.pdf$/i, ""),
        }),
      });

      if (!paperRes.ok) throw new Error("Failed to create paper entry");

      const paper = await paperRes.json();
      setPapers([paper, ...papers]);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.toLowerCase().endsWith(".pdf")
      );

      for (const file of files) {
        await uploadFile(file);
      }
    },
    [papers]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      await uploadFile(file);
    }

    e.target.value = "";
  };

  const deletePaper = async (id: string) => {
    if (!confirm("Delete this paper?")) return;

    try {
      const res = await fetch(`/api/papers?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPapers(papers.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      paper.title.toLowerCase().includes(search.toLowerCase()) ||
      paper.authors.some((a) =>
        a.toLowerCase().includes(search.toLowerCase())
      );
    const matchesFilter = filter === "all" || paper.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusIcon: Record<"reading" | "done", React.ReactNode> = {
    reading: <BookOpen className="h-4 w-4 text-[var(--accent)]" />,
    done: <CheckCircle className="h-4 w-4 text-green-500" />,
  };

  const statusLabel: Record<"reading" | "done", string> = {
    reading: "Reading",
    done: "Done",
  };

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text)]">Library</h1>
          <label>
            <input
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button className="gap-2 bg-[var(--primary)] cursor-pointer" asChild>
              <span>
                <Plus className="h-4 w-4" />
                Add Paper
              </span>
            </Button>
          </label>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search papers..."
              className="pl-9 bg-[var(--surface)]"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "reading", "done"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-[var(--primary)]" : ""}
              >
                {f === "all" ? "All" : statusLabel[f]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Papers grid */}
      <div
        className={`flex-1 overflow-auto p-6 ${
          isDragging ? "bg-[var(--primary)]/5" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--primary)]/10 border-2 border-dashed border-[var(--primary)] rounded-lg m-6 z-10">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-[var(--primary)]" />
              <p className="mt-2 text-lg font-medium text-[var(--text)]">
                Drop PDF files here
              </p>
            </div>
          </div>
        )}

        {filteredPapers.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <FileText className="mx-auto h-12 w-12 text-[var(--muted)]" />
              <h3 className="mt-4 text-lg font-medium text-[var(--text)]">
                No papers yet
              </h3>
              <p className="mt-2 text-[var(--muted)]">
                Drag & drop a PDF or click "Add Paper" to get started
              </p>
              <div className="mt-6 text-left space-y-2 bg-[var(--surface)] rounded-lg p-4">
                <p className="text-sm font-medium text-[var(--text)]">Quick Start:</p>
                <p className="text-sm text-[var(--muted)]">1. Add a PDF paper</p>
                <p className="text-sm text-[var(--muted)]">2. Use AI to summarize & explain</p>
                <p className="text-sm text-[var(--muted)]">3. Save insights as you read</p>
                <a href="/guide" className="inline-block mt-2 text-sm text-[var(--primary)] hover:underline">
                  Read the full guide →
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPapers.map((paper) => (
              <Card
                key={paper.id}
                className="group cursor-pointer bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)] transition-colors"
              >
                <Link href={`/read/${paper.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {statusIcon[paper.status]}
                        <Badge
                          variant={paper.status === "done" ? "default" : "outline"}
                          className={`text-xs ${
                            paper.status === "done" ? "bg-green-500" : ""
                          }`}
                        >
                          {statusLabel[paper.status]}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.preventDefault()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={(e) => {
                              e.preventDefault();
                              deletePaper(paper.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="line-clamp-2 text-base text-[var(--text)]">
                      {paper.title}
                    </CardTitle>
                    {paper.authors.length > 0 && (
                      <CardDescription className="line-clamp-1">
                        {paper.authors.join(", ")}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>
                        Page {paper.currentPage}/{paper.totalPages || "?"}
                      </span>
                      <span>
                        {new Date(paper.dateAdded).toLocaleDateString()}
                      </span>
                    </div>
                    {/* Tags */}
                    {paper.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {paper.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {paper.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{paper.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
