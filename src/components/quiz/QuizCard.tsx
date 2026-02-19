"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Check, ArrowRight, Loader2, FileText } from "lucide-react";
import { QuizQuestion, QuizAnswer, OpenEndedQuestion, QuizDifficulty } from "@/types";
import { useHotkeys } from "@/components/primitives/useHotkeys";
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

// Pass thresholds - must match quiz.ts
const difficultyThresholds: Record<QuizDifficulty, number> = {
  skim: 50,
  read: 60,
  study: 70,
  master: 80,
};

interface QuizCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  difficulty: QuizDifficulty;
  onAnswer: (answer: number | string, isCorrect: boolean, evaluation?: string) => void;
  onSkip: () => void;
  onContinue: () => void;
  onExit: () => void;
  answered: boolean;
  existingAnswer?: QuizAnswer;
}

export function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  difficulty,
  onAnswer,
  onSkip,
  onContinue,
  onExit,
  answered,
  existingAnswer,
}: QuizCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    evaluation?: string;
  } | null>(null);

  const progressPercent = (questionNumber / totalQuestions) * 100;

  // Reset state when question changes (fixes issues 4 & 5)
  useEffect(() => {
    setSelectedOption(null);
    setOpenEndedAnswer("");
    setFeedback(null);
  }, [questionNumber]);

  // Validate MC selection (now separate from selection)
  const validateMultipleChoice = useCallback(() => {
    if (answered || question.type !== "multiple-choice" || selectedOption === null) return;

    const isCorrect = selectedOption === question.correctIndex;
    onAnswer(selectedOption, isCorrect);
    setFeedback({ isCorrect });
  }, [answered, question, selectedOption, onAnswer]);

  const handleMultipleChoiceSelect = useCallback(
    (index: number) => {
      if (answered || question.type !== "multiple-choice") return;
      // Only select, don't validate
      setSelectedOption(index);
    },
    [answered, question]
  );

  const handleOpenEndedSubmit = useCallback(async () => {
    if (answered || !openEndedAnswer.trim()) return;

    setIsEvaluating(true);

    try {
      const q = question as OpenEndedQuestion;
      const response = await fetch("/api/quiz/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          expectedAnswer: q.expectedAnswer,
          keyPoints: q.keyPoints,
          userAnswer: openEndedAnswer,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate answer");
      }

      const evaluation = await response.json();
      const threshold = difficultyThresholds[difficulty];
      const isCorrect = evaluation.isCorrect || evaluation.score >= threshold;

      onAnswer(openEndedAnswer, isCorrect, evaluation.feedback);
      setFeedback({
        isCorrect,
        evaluation: evaluation.feedback,
      });
    } catch (error) {
      // On error, mark as incorrect
      onAnswer(openEndedAnswer, false, "Could not evaluate answer");
      setFeedback({
        isCorrect: false,
        evaluation: "Could not evaluate answer. Please try again.",
      });
    } finally {
      setIsEvaluating(false);
    }
  }, [answered, openEndedAnswer, question, onAnswer, difficulty]);

  // Cmd+Enter keyboard shortcut (issue 6)
  useHotkeys(
    "mod+enter",
    () => {
      if (answered) {
        // After feedback, continue to next question
        onContinue();
      } else if (question.type === "multiple-choice" && selectedOption !== null) {
        // Validate MC selection
        validateMultipleChoice();
      } else if (question.type === "open-ended" && openEndedAnswer.trim()) {
        // Submit open-ended answer
        handleOpenEndedSubmit();
      }
    },
    { enableOnFormTags: true }
  );

  // Arrow key navigation for multiple-choice
  useEffect(() => {
    if (answered || question.type !== "multiple-choice") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const optionsCount = question.options.length;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedOption((prev) => {
          if (prev === null) return 0;
          return (prev + 1) % optionsCount;
        });
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedOption((prev) => {
          if (prev === null) return optionsCount - 1;
          return (prev - 1 + optionsCount) % optionsCount;
        });
      } else if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && selectedOption !== null) {
        e.preventDefault();
        validateMultipleChoice();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answered, question, selectedOption, validateMultipleChoice]);

  const renderMultipleChoice = () => {
    if (question.type !== "multiple-choice") return null;

    return (
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = index === question.correctIndex;
          const showResult = answered;

          let optionClass = "border-[var(--border)] hover:border-[var(--primary)]";
          if (showResult) {
            if (isCorrect) {
              optionClass = "border-[var(--primary)] bg-[var(--primary)]/10";
            } else if (isSelected && !isCorrect) {
              optionClass = "border-[var(--accent)] bg-[var(--accent)]/10";
            }
          } else if (isSelected) {
            optionClass = "border-[var(--primary)] bg-[var(--primary)]/10";
          }

          return (
            <button
              key={index}
              onClick={() => handleMultipleChoiceSelect(index)}
              disabled={answered}
              className={`w-full p-4 rounded-lg border text-left transition-all ${optionClass}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[var(--text)]">
                  <span className="font-medium mr-2">
                    {String.fromCharCode(65 + index)})
                  </span>
                  <MathText>{option}</MathText>
                </span>
                {showResult && isCorrect && (
                  <Check className="h-5 w-5 text-[var(--primary)]" />
                )}
                {showResult && isSelected && !isCorrect && (
                  <X className="h-5 w-5 text-[var(--accent)]" />
                )}
              </div>
            </button>
          );
        })}

        {/* Validate button - only show when option selected but not yet validated */}
        {!answered && selectedOption !== null && (
          <div className="flex justify-end mt-4">
            <Button
              onClick={validateMultipleChoice}
              className="bg-[var(--primary)] text-white"
            >
              Validate
              <span className="ml-2 text-xs opacity-70">⌘↵</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderOpenEnded = () => {
    if (question.type !== "open-ended") return null;

    return (
      <div className="space-y-4">
        <Textarea
          value={openEndedAnswer}
          onChange={(e) => setOpenEndedAnswer(e.target.value)}
          placeholder="Type your answer here..."
          disabled={answered}
          className="min-h-[120px] bg-[var(--surface)] border-[var(--border)] text-[var(--text)]"
        />
        {!answered && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onSkip}>
              Skip
            </Button>
            <Button
              onClick={handleOpenEndedSubmit}
              disabled={!openEndedAnswer.trim() || isEvaluating}
              className="bg-[var(--primary)] text-white"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  Submit Answer
                  <span className="ml-2 text-xs opacity-70">⌘↵</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderFeedback = () => {
    if (!answered || !feedback) return null;

    return (
      <div
        className={`mt-6 p-4 rounded-lg border ${
          feedback.isCorrect
            ? "border-[var(--primary)] bg-[var(--primary)]/10"
            : "border-[var(--accent)] bg-[var(--accent)]/10"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {feedback.isCorrect ? (
            <>
              <Check className="h-5 w-5 text-[var(--primary)]" />
              <span className="font-semibold text-[var(--primary)]">Correct!</span>
            </>
          ) : (
            <>
              <X className="h-5 w-5 text-[var(--accent)]" />
              <span className="font-semibold text-[var(--accent)]">Incorrect</span>
            </>
          )}
        </div>

        {/* Explanation with math support */}
        <div className="text-[var(--text)] mb-3">
          <MathText>{question.explanation}</MathText>
        </div>

        {/* Open-ended evaluation feedback */}
        {feedback.evaluation && (
          <div className="text-[var(--muted)] text-sm italic mb-3">
            <MathText>{feedback.evaluation}</MathText>
          </div>
        )}

        {/* Source reference */}
        {question.source && (
          <div className="flex items-center gap-1 text-[var(--muted)] text-sm">
            <FileText className="h-4 w-4" />
            Reference: {question.source}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Exit</span>
        </button>
        <span className="text-[var(--text)] font-medium">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="w-16" />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--border)]">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-12">
        <div className="mx-auto max-w-2xl">
          {/* Question with math support */}
          <h2 className="text-xl font-medium text-[var(--text)] text-center mb-8">
            <MathText>{question.question}</MathText>
          </h2>

          {/* Answer options */}
          {question.type === "multiple-choice"
            ? renderMultipleChoice()
            : renderOpenEnded()}

          {/* Feedback */}
          {renderFeedback()}

          {/* Continue / Skip buttons */}
          <div className="mt-8 flex justify-end gap-3">
            {!answered && question.type === "multiple-choice" && selectedOption === null && (
              <Button variant="outline" onClick={onSkip}>
                Skip
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {answered && (
              <Button
                onClick={onContinue}
                className="bg-[var(--primary)] text-white"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
                <span className="ml-2 text-xs opacity-70">⌘↵</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
