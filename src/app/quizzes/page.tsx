"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BrainCircuit,
  FileText,
  ArrowRight,
  Trophy,
  Calendar,
  Target,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface PaperWithQuizStats {
  id: string;
  title: string;
  quizStats?: {
    attempts: number;
    best_score: number;
    last_attempt: string;
  };
}

export default function QuizzesPage() {
  const [papers, setPapers] = useState<PaperWithQuizStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "attempted" | "not-attempted">("all");

  useEffect(() => {
    // Fetch all papers with quiz stats
    fetch("/api/papers")
      .then((res) => res.json())
      .then((data) => {
        // For now, papers don't have quiz stats from the API
        // We'll need to parse it from sidecars in a real implementation
        // This is a placeholder that works with the current API
        setPapers(
          data.map((p: { id: string; title: string }) => ({
            id: p.id,
            title: p.title,
            quizStats: undefined, // Would be populated from sidecar frontmatter
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filteredPapers = papers.filter((paper) => {
    if (filter === "attempted") return paper.quizStats?.attempts && paper.quizStats.attempts > 0;
    if (filter === "not-attempted") return !paper.quizStats?.attempts;
    return true;
  });

  const totalAttempts = papers.reduce(
    (sum, p) => sum + (p.quizStats?.attempts || 0),
    0
  );
  const papersWithQuizzes = papers.filter(
    (p) => p.quizStats?.attempts && p.quizStats.attempts > 0
  ).length;

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted)]" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-full overflow-auto bg-[var(--background)]">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-[var(--text)]">
                <BrainCircuit className="h-8 w-8 text-[var(--primary)]" />
                Quizzes
              </h1>
              <p className="mt-2 text-[var(--muted)]">
                Test your understanding of the papers you&apos;ve read.
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2 text-[var(--muted)] text-sm mb-1">
                <Target className="h-4 w-4" />
                Total Attempts
              </div>
              <div className="text-2xl font-bold text-[var(--text)]">
                {totalAttempts}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2 text-[var(--muted)] text-sm mb-1">
                <FileText className="h-4 w-4" />
                Papers Quizzed
              </div>
              <div className="text-2xl font-bold text-[var(--text)]">
                {papersWithQuizzes} / {papers.length}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2 text-[var(--muted)] text-sm mb-1">
                <Trophy className="h-4 w-4" />
                Average Best Score
              </div>
              <div className="text-2xl font-bold text-[var(--text)]">
                {papersWithQuizzes > 0
                  ? Math.round(
                      papers
                        .filter((p) => p.quizStats?.best_score)
                        .reduce((sum, p) => sum + (p.quizStats?.best_score || 0), 0) /
                        papersWithQuizzes
                    )
                  : 0}
                %
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All Papers ({papers.length})
            </Button>
            <Button
              variant={filter === "attempted" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("attempted")}
            >
              Attempted ({papersWithQuizzes})
            </Button>
            <Button
              variant={filter === "not-attempted" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("not-attempted")}
            >
              Not Attempted ({papers.length - papersWithQuizzes})
            </Button>
          </div>

          {/* Paper List */}
          {filteredPapers.length === 0 ? (
            <div className="text-center py-12">
              <BrainCircuit className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--text)] mb-2">
                {filter === "all"
                  ? "No papers in your library"
                  : filter === "attempted"
                  ? "No quizzes attempted yet"
                  : "All papers have been quizzed"}
              </h3>
              <p className="text-[var(--muted)]">
                {filter === "all"
                  ? "Add some papers to get started with quizzes."
                  : filter === "attempted"
                  ? "Start a quiz from any paper to test your understanding."
                  : "Great job! You've quizzed all your papers."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-3">
                {filteredPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--primary)] transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="font-medium text-[var(--text)] truncate">
                        {paper.title}
                      </h3>
                      {paper.quizStats ? (
                        <div className="flex items-center gap-4 mt-2 text-sm text-[var(--muted)]">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {paper.quizStats.attempts} attempts
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Best: {paper.quizStats.best_score}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {paper.quizStats.last_attempt}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--muted)] mt-1">
                          No quizzes attempted
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {paper.quizStats?.best_score && paper.quizStats.best_score >= 80 && (
                        <Badge className="bg-green-500">
                          <Trophy className="h-3 w-3 mr-1" />
                          {paper.quizStats.best_score}%
                        </Badge>
                      )}
                      <Link href={`/read/${paper.id}`}>
                        <Button size="sm" className="gap-1">
                          Quiz me
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Tips */}
          <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="font-medium text-[var(--text)] mb-2">Tips for Better Retention</h3>
            <ul className="space-y-1 text-sm text-[var(--muted)]">
              <li>• Quiz yourself soon after reading - don&apos;t wait too long</li>
              <li>• Focus on papers you found challenging</li>
              <li>• Review missed questions to identify knowledge gaps</li>
              <li>• Try both multiple-choice and open-ended questions</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
