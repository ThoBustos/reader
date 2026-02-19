"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { QuizConfig as QuizConfigType, QuizQuestionType, QuizScope, QuizDifficulty } from "@/types";

interface QuizConfigProps {
  paperTitle: string;
  currentPage?: number;
  totalPages?: number;
  onStart: (config: QuizConfigType) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QuizConfig({
  paperTitle,
  currentPage,
  totalPages,
  onStart,
  onCancel,
  isLoading = false,
}: QuizConfigProps) {
  const [questionCount, setQuestionCount] = useState(5);
  const [customCount, setCustomCount] = useState("");
  const [questionTypes, setQuestionTypes] = useState<QuizQuestionType[]>(["multiple-choice"]);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("read");
  const [scope, setScope] = useState<QuizScope>("full");
  const [pageStart, setPageStart] = useState(currentPage?.toString() || "1");
  const [pageEnd, setPageEnd] = useState(currentPage?.toString() || "1");

  const countOptions = [5, 10, 20];

  const difficultyOptions: { value: QuizDifficulty; label: string; description: string }[] = [
    { value: "skim", label: "Skim", description: "Main ideas, quick recall" },
    { value: "read", label: "Read", description: "Core concepts, methodology" },
    { value: "study", label: "Study", description: "Analysis, connections" },
    { value: "master", label: "Master", description: "Critical evaluation, edge cases" },
  ];

  const toggleQuestionType = (type: QuizQuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        // Don't allow removing the last type
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleStart = () => {
    const count = customCount ? parseInt(customCount, 10) : questionCount;
    const config: QuizConfigType = {
      questionCount: count,
      questionTypes,
      difficulty,
      scope,
      scopeDetail:
        scope === "pages"
          ? { start: parseInt(pageStart, 10), end: parseInt(pageEnd, 10) }
          : undefined,
    };
    onStart(config);
  };

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit</span>
        </button>
        <span className="text-[var(--muted)] text-sm truncate max-w-md">
          Quiz: {paperTitle}
        </span>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-12">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-semibold text-[var(--text)] text-center mb-8">
            Test Your Knowledge
          </h1>

          {/* Question Count */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text)] mb-3">
              How many questions?
            </label>
            <div className="flex gap-2 flex-wrap">
              {countOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    setQuestionCount(count);
                    setCustomCount("");
                  }}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    questionCount === count && !customCount
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)]"
                  }`}
                >
                  {count}
                </button>
              ))}
              <Input
                type="number"
                placeholder="Custom"
                value={customCount}
                onChange={(e) => setCustomCount(e.target.value)}
                className="w-24"
                min={1}
                max={50}
              />
            </div>
          </div>

          {/* Question Types */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text)] mb-3">
              Question types
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={questionTypes.includes("multiple-choice")}
                  onChange={() => toggleQuestionType("multiple-choice")}
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                <span className="text-[var(--text)]">Multiple choice</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={questionTypes.includes("open-ended")}
                  onChange={() => toggleQuestionType("open-ended")}
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                <span className="text-[var(--text)]">Open-ended</span>
              </label>
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text)] mb-3">
              Difficulty
            </label>
            <div className="grid grid-cols-2 gap-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDifficulty(option.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    difficulty === option.value
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)]"
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className={`text-xs ${
                    difficulty === option.value ? "text-white/80" : "text-[var(--muted)]"
                  }`}>
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div className="mb-10">
            <label className="block text-sm font-medium text-[var(--text)] mb-3">
              Focus on
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "full"}
                  onChange={() => setScope("full")}
                  className="h-4 w-4"
                />
                <span className="text-[var(--text)]">Full paper</span>
              </label>
              {currentPage && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === "selection"}
                    onChange={() => setScope("selection")}
                    className="h-4 w-4"
                  />
                  <span className="text-[var(--text)]">
                    Current page (p. {currentPage})
                  </span>
                </label>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "pages"}
                  onChange={() => setScope("pages")}
                  className="h-4 w-4"
                />
                <span className="text-[var(--text)]">Pages</span>
                {scope === "pages" && (
                  <div className="flex items-center gap-2 ml-2">
                    <Input
                      type="number"
                      value={pageStart}
                      onChange={(e) => setPageStart(e.target.value)}
                      className="w-16"
                      min={1}
                      max={totalPages || 999}
                    />
                    <span className="text-[var(--muted)]">to</span>
                    <Input
                      type="number"
                      value={pageEnd}
                      onChange={(e) => setPageEnd(e.target.value)}
                      className="w-16"
                      min={1}
                      max={totalPages || 999}
                    />
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                Start Quiz
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
