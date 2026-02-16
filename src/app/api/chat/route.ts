import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/store/settings";
import { getPaper } from "@/lib/store/papers";
import { saveChatMessage, getChatSession } from "@/lib/store/chat";
import { initGemini, askGemini, uploadPaper } from "@/lib/llm/gemini";
import { initClaude, askClaude } from "@/lib/llm/claude";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

// Simple PDF text extraction (fallback for Claude)
async function extractPdfText(filePath: string): Promise<string> {
  // For now, return a placeholder - in production would use pdf-parse or similar
  return `[PDF content from ${filePath}]`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperId, message, context } = body;

    if (!paperId || !message) {
      return NextResponse.json(
        { error: "Paper ID and message required" },
        { status: 400 }
      );
    }

    const settings = getSettings();
    const paper = getPaper(paperId);

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Save user message
    saveChatMessage(paperId, {
      id: uuidv4(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      context,
    });

    let stream: ReadableStream<Uint8Array>;

    if (settings.llmProvider === "gemini" && settings.geminiApiKey) {
      initGemini(settings.geminiApiKey);
      const pdfBase64 = await uploadPaper(paper.filePath);
      stream = await askGemini(pdfBase64, message, context);
    } else if (settings.llmProvider === "claude" && settings.claudeApiKey) {
      initClaude(settings.claudeApiKey);
      const pdfText = await extractPdfText(paper.filePath);
      stream = await askClaude(pdfText, message, context);
    } else {
      return NextResponse.json(
        { error: "No LLM provider configured. Please add API keys in settings." },
        { status: 400 }
      );
    }

    // Return streaming response
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get("paperId");

    if (!paperId) {
      return NextResponse.json(
        { error: "Paper ID required" },
        { status: 400 }
      );
    }

    const session = getChatSession(paperId);
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get chat history" },
      { status: 500 }
    );
  }
}
