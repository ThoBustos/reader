"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { QuizConfig } from "./QuizConfig";
import { QuizCard } from "./QuizCard";
import { QuizResults } from "./QuizResults";
import { useQuiz } from "./useQuiz";
import { QuizConfig as QuizConfigType } from "@/types";
import { Loader2 } from "lucide-react";

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperId: string;
  paperTitle: string;
  currentPage?: number;
  totalPages?: number;
}

export function QuizModal({
  open,
  onOpenChange,
  paperId,
  paperTitle,
  currentPage,
  totalPages,
}: QuizModalProps) {
  const {
    phase,
    session,
    currentQuestionIndex,
    isLoading,
    error,
    startQuiz,
    answerQuestion,
    skipQuestion,
    nextQuestion,
    saveResults,
    reset,
  } = useQuiz();

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [answered, setAnswered] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const handleClose = useCallback(() => {
    if (phase === "questions" && !showExitConfirm) {
      setShowExitConfirm(true);
      return;
    }
    setShowExitConfirm(false);
    onOpenChange(false);
  }, [phase, showExitConfirm, onOpenChange]);

  const handleStart = useCallback(
    (config: QuizConfigType) => {
      startQuiz(paperId, config);
    },
    [paperId, startQuiz]
  );

  const handleAnswer = useCallback(
    (answer: number | string, isCorrect: boolean, evaluation?: string) => {
      answerQuestion(answer, isCorrect, evaluation);
      setAnswered(true);
    },
    [answerQuestion]
  );

  const handleContinue = useCallback(() => {
    setAnswered(false);
    nextQuestion();
  }, [nextQuestion]);

  const handleSkip = useCallback(() => {
    setAnswered(false);
    skipQuestion();
  }, [skipQuestion]);

  const handleDone = useCallback(async () => {
    await saveResults();
    onOpenChange(false);
  }, [saveResults, onOpenChange]);

  const handleTryAgain = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="h-screen w-screen bg-[var(--background)] overflow-hidden flex flex-col">
            {/* Exit confirmation overlay */}
            {showExitConfirm && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                <div className="bg-[var(--surface)] rounded-lg p-6 max-w-sm mx-4 border border-[var(--border)]">
                  <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                    Exit Quiz?
                  </h3>
                  <p className="text-[var(--muted)] mb-4">
                    Your progress will be lost if you exit now.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowExitConfirm(false)}
                      className="px-4 py-2 rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]"
                    >
                      Continue Quiz
                    </button>
                    <button
                      onClick={() => {
                        setShowExitConfirm(false);
                        onOpenChange(false);
                      }}
                      className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {phase === "loading" && (
              <div className="flex h-full flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] mb-4" />
                <p className="text-[var(--muted)]">Generating quiz questions...</p>
                {error && (
                  <p className="text-red-500 mt-4">{error}</p>
                )}
              </div>
            )}

            {/* Config phase */}
            {phase === "config" && (
              <QuizConfig
                paperTitle={paperTitle}
                currentPage={currentPage}
                totalPages={totalPages}
                onStart={handleStart}
                onCancel={handleClose}
                isLoading={isLoading}
              />
            )}

            {/* Questions phase */}
            {phase === "questions" && session && (
              <QuizCard
                question={session.questions[currentQuestionIndex]}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={session.questions.length}
                difficulty={session.config.difficulty}
                onAnswer={handleAnswer}
                onSkip={handleSkip}
                onContinue={handleContinue}
                onExit={handleClose}
                answered={answered}
                existingAnswer={
                  session.answers.find((a) => a.questionIndex === currentQuestionIndex)
                }
              />
            )}

            {/* Results phase */}
            {phase === "results" && session && (
              <QuizResults
                session={session}
                onDone={handleDone}
                onTryAgain={handleTryAgain}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
