import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { getSettings } from "@/lib/store/settings";
import { evaluateAnswerGemini, evaluateAnswerClaude } from "@/lib/llm/quiz";
import { QuizDifficulty } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, expectedAnswer, keyPoints, userAnswer, difficulty = "study" } = body as {
      question: string;
      expectedAnswer: string;
      keyPoints: string[];
      userAnswer: string;
      difficulty?: QuizDifficulty;
    };

    if (!question || !expectedAnswer || !keyPoints || !userAnswer) {
      return NextResponse.json(
        { error: "Question, expectedAnswer, keyPoints, and userAnswer required" },
        { status: 400 }
      );
    }

    const settings = getSettings();
    let evaluation;

    if (settings.llmProvider === "gemini" && settings.geminiApiKey) {
      const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
      evaluation = await evaluateAnswerGemini(
        genAI,
        question,
        expectedAnswer,
        keyPoints,
        userAnswer,
        difficulty,
        settings.geminiModel
      );
    } else if (settings.llmProvider === "claude" && settings.claudeApiKey) {
      const anthropic = new Anthropic({ apiKey: settings.claudeApiKey });
      evaluation = await evaluateAnswerClaude(
        anthropic,
        question,
        expectedAnswer,
        keyPoints,
        userAnswer,
        difficulty
      );
    } else {
      return NextResponse.json(
        { error: "No LLM provider configured. Please add API keys in settings." },
        { status: 400 }
      );
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Answer evaluation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to evaluate answer: ${errorMessage}` },
      { status: 500 }
    );
  }
}
