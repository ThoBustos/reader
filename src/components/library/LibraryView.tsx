"use client";

import { useState, useEffect, useCallback } from "react";
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
  Clock,
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
  const [filter, setFilter] = useState<"all" | "queued" | "reading" | "completed">(
    "all"
  );
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
          title: originalName.replace(/\.pdf$/i, ""),
          filePath,
        }),
      });

      if (!paperRes.ok) throw new Error("Failed to create paper entry");

      const paper = await paperRes.json();
      setPapers([...papers, paper]);
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

  const statusIcon = {
    queued: <Clock className="h-4 w-4 text-[var(--muted)]" />,
    reading: <BookOpen className="h-4 w-4 text-[var(--accent)]" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  };

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text)]">Reading Queue</h1>
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
            {(["all", "queued", "reading", "completed"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-[var(--primary)]" : ""}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
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
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-[var(--muted)]" />
              <h3 className="mt-4 text-lg font-medium text-[var(--text)]">
                No papers yet
              </h3>
              <p className="mt-2 text-[var(--muted)]">
                Add a PDF to start reading
              </p>
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
                        <Badge variant="outline" className="text-xs">
                          Pass {paper.pass}
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
                    {/* Progress bar */}
                    <div className="mt-2 h-1 w-full rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{
                          width: `${(paper.currentPage / (paper.totalPages || 1)) * 100}%`,
                        }}
                      />
                    </div>
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
