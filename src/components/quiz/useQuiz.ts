"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  QuizConfig,
  QuizSession,
  QuizQuestion,
  QuizAnswer,
} from "@/types";

export type QuizPhase = "config" | "loading" | "questions" | "results";

interface UseQuizReturn {
  phase: QuizPhase;
  session: QuizSession | null;
  currentQuestionIndex: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  startQuiz: (paperId: string, config: QuizConfig) => Promise<void>;
  answerQuestion: (answer: number | string, isCorrect: boolean, evaluation?: string) => void;
  skipQuestion: () => void;
  nextQuestion: () => void;
  completeQuiz: () => void;
  saveResults: () => Promise<void>;
  reset: () => void;
}

export function useQuiz(): UseQuizReturn {
  const [phase, setPhase] = useState<QuizPhase>("config");
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = useCallback(async (paperId: string, config: QuizConfig) => {
    setIsLoading(true);
    setError(null);
    setPhase("loading");

    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, config }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate quiz");
      }

      const { questions, paperTitle } = await response.json();

      const newSession: QuizSession = {
        id: uuidv4(),
        paperId,
        paperTitle,
        startedAt: new Date().toISOString(),
        config,
        questions,
        answers: [],
      };

      setSession(newSession);
      setCurrentQuestionIndex(0);
      setPhase("questions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("config");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const answerQuestion = useCallback(
    (userAnswer: number | string, isCorrect: boolean, evaluation?: string) => {
      if (!session) return;

      const answer: QuizAnswer = {
        questionIndex: currentQuestionIndex,
        userAnswer,
        isCorrect,
        evaluation,
        skipped: false,
      };

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: [...prev.answers, answer],
        };
      });
    },
    [session, currentQuestionIndex]
  );

  const skipQuestion = useCallback(() => {
    if (!session) return;

    const answer: QuizAnswer = {
      questionIndex: currentQuestionIndex,
      userAnswer: "",
      isCorrect: false,
      skipped: true,
    };

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: [...prev.answers, answer],
      };
    });

    // Move to next question or results
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      completeQuiz();
    }
  }, [session, currentQuestionIndex]);

  const nextQuestion = useCallback(() => {
    if (!session) return;

    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      completeQuiz();
    }
  }, [session, currentQuestionIndex]);

  const completeQuiz = useCallback(() => {
    if (!session) return;

    const correctCount = session.answers.filter((a) => a.isCorrect).length;

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        completedAt: new Date().toISOString(),
        score: {
          correct: correctCount,
          total: prev.questions.length,
        },
      };
    });

    setPhase("results");
  }, [session]);

  const saveResults = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quiz/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save quiz results");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const reset = useCallback(() => {
    setPhase("config");
    setSession(null);
    setCurrentQuestionIndex(0);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    phase,
    session,
    currentQuestionIndex,
    isLoading,
    error,
    startQuiz,
    answerQuestion,
    skipQuestion,
    nextQuestion,
    completeQuiz,
    saveResults,
    reset,
  };
}
