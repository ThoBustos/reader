import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/store/settings";
import { getPaper } from "@/lib/store/papers";
import { saveChatMessage, getChatSession } from "@/lib/store/chat";
import { initGemini, askGemini, uploadPaper } from "@/lib/llm/gemini";
import { initClaude, askClaude } from "@/lib/llm/claude";
import { v4 as uuidv4 } from "uuid";

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
      const pdfBase64 = await uploadPaper(paper.pdfPath);
      stream = await askGemini(pdfBase64, message, context, settings.geminiModel);
    } else if (settings.llmProvider === "claude" && settings.claudeApiKey) {
      initClaude(settings.claudeApiKey);
      const pdfText = await extractPdfText(paper.pdfPath);
      stream = await askClaude(pdfText, message, context);
    } else {
      return NextResponse.json(
        { error: "No LLM provider configured. Please add API keys in settings." },
        { status: 400 }
      );
    }

    // Create a transform stream that collects the response for saving
    let fullResponse = "";
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        fullResponse += text;
        controller.enqueue(chunk);
      },
      flush() {
        // Save assistant message when stream completes
        if (fullResponse) {
          saveChatMessage(paperId, {
            id: uuidv4(),
            role: "assistant",
            content: fullResponse,
            timestamp: new Date().toISOString(),
          });
        }
      },
    });

    // Pipe through transform to collect and save
    const responseStream = stream.pipeThrough(transformStream);

    // Return streaming response
    return new NextResponse(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process chat message: ${errorMessage}` },
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
