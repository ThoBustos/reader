"use client";

import { Button } from "@/components/ui/button";
import { Check, X, RefreshCw, Loader2, ArrowLeft } from "lucide-react";
import { QuizSession } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Component for rendering text with math formulas
function MathText({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <span>{children}</span>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

interface QuizResultsProps {
  session: QuizSession;
  onDone: () => void;
  onTryAgain: () => void;
  isLoading?: boolean;
}

export function QuizResults({
  session,
  onDone,
  onTryAgain,
  isLoading = false,
}: QuizResultsProps) {
  const score = session.score || { correct: 0, total: session.questions.length };
  const scorePercent = Math.round((score.correct / score.total) * 100);

  // Get missed questions
  const missedQuestions = session.answers
    .filter((a) => !a.isCorrect && !a.skipped)
    .map((a) => {
      const q = session.questions[a.questionIndex];
      let correctAnswer = "";
      let userAnswer = "";

      if (q.type === "multiple-choice") {
        correctAnswer = q.options[q.correctIndex];
        userAnswer =
          typeof a.userAnswer === "number"
            ? q.options[a.userAnswer]
            : String(a.userAnswer);
      } else {
        correctAnswer = q.expectedAnswer;
        userAnswer = String(a.userAnswer);
      }

      return {
        question: q.question,
        userAnswer,
        correctAnswer,
        evaluation: a.evaluation,
      };
    });

  const skippedCount = session.answers.filter((a) => a.skipped).length;

  // Use theme colors based on score
  const isGoodScore = scorePercent >= 70;
  const isMediumScore = scorePercent >= 50 && scorePercent < 70;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--background)]">
      {/* Header with exit button (issue 8) */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <button
          onClick={onDone}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Paper</span>
        </button>
        <span className="text-lg font-semibold text-[var(--text)]">
          Quiz Complete!
        </span>
        <div className="w-28" /> {/* Spacer for centering */}
      </div>

      {/* Scrollable content (issue 7) */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-12">
          {/* Score Display - using theme colors (issue 2) */}
          <div className="text-center mb-10">
            <div className={`text-6xl font-bold mb-2 ${
              isGoodScore
                ? "text-[var(--primary)]"
                : isMediumScore
                  ? "text-[var(--muted)]"
                  : "text-[var(--accent)]"
            }`}>
              {score.correct} / {score.total}
            </div>
            <div className={`text-2xl mb-4 ${
              isGoodScore
                ? "text-[var(--primary)]"
                : isMediumScore
                  ? "text-[var(--muted)]"
                  : "text-[var(--accent)]"
            }`}>
              {scorePercent}%
            </div>

            {/* Progress bar with theme colors */}
            <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className={`h-full transition-all duration-500 ${
                  isGoodScore
                    ? "bg-[var(--primary)]"
                    : isMediumScore
                      ? "bg-[var(--muted)]"
                      : "bg-[var(--accent)]"
                }`}
                style={{ width: `${scorePercent}%` }}
              />
            </div>

            {/* Stats with theme colors */}
            <div className="flex justify-center gap-8 mt-6 text-sm">
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <Check className="h-4 w-4" />
                <span>{score.correct} correct</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <X className="h-4 w-4" />
                <span>{score.total - score.correct - skippedCount} incorrect</span>
              </div>
              {skippedCount > 0 && (
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <span>{skippedCount} skipped</span>
                </div>
              )}
            </div>
          </div>

          {/* Missed Questions Review with math support (issue 3) */}
          {missedQuestions.length > 0 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
                Review Missed Questions
              </h3>
              <div className="space-y-4">
                {missedQuestions.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                  >
                    <p className="font-medium text-[var(--text)] mb-2">
                      <MathText>{item.question}</MathText>
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-[var(--accent)]">
                        <span className="text-[var(--muted)]">Your answer:</span>{" "}
                        {item.userAnswer ? <MathText>{item.userAnswer}</MathText> : "(skipped)"}
                      </p>
                      <p className="text-[var(--primary)]">
                        <span className="text-[var(--muted)]">Correct:</span>{" "}
                        <MathText>{item.correctAnswer}</MathText>
                      </p>
                      {item.evaluation && (
                        <p className="text-[var(--muted)] italic mt-2">
                          <MathText>{item.evaluation}</MathText>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={onTryAgain}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={onDone}
              disabled={isLoading}
              className="bg-[var(--primary)] text-white flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Done"
              )}
            </Button>
          </div>

          {/* Info text */}
          <p className="text-center text-[var(--muted)] text-sm mt-6">
            Your results will be saved to the paper&apos;s notes.
          </p>
        </div>
      </div>
    </div>
  );
}
