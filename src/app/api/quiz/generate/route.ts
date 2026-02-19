import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { getSettings } from "@/lib/store/settings";
import { getPaper } from "@/lib/store/papers";
import { initGemini, uploadPaper } from "@/lib/llm/gemini";
import {
  generateQuizQuestionsGemini,
  generateQuizQuestionsClaude,
} from "@/lib/llm/quiz";
import { QuizConfig } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperId, config } = body as {
      paperId: string;
      config: QuizConfig;
    };

    if (!paperId || !config) {
      return NextResponse.json(
        { error: "Paper ID and config required" },
        { status: 400 }
      );
    }

    const settings = getSettings();
    const paper = getPaper(paperId);

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    let questions;

    if (settings.llmProvider === "gemini" && settings.geminiApiKey) {
      initGemini(settings.geminiApiKey);
      const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
      const pdfBase64 = await uploadPaper(paper.pdfPath);
      questions = await generateQuizQuestionsGemini(
        genAI,
        pdfBase64,
        config,
        settings.geminiModel
      );
    } else if (settings.llmProvider === "claude" && settings.claudeApiKey) {
      const anthropic = new Anthropic({ apiKey: settings.claudeApiKey });
      // For Claude, we need to extract PDF text (simplified for now)
      const documentText = `[PDF content from ${paper.pdfPath}]`;
      questions = await generateQuizQuestionsClaude(anthropic, documentText, config);
    } else {
      return NextResponse.json(
        { error: "No LLM provider configured. Please add API keys in settings." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      questions,
      paperTitle: paper.title,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate quiz: ${errorMessage}` },
      { status: 500 }
    );
  }
}
