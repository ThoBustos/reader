import {
  GoogleGenerativeAI,
  Part,
  Content,
  ChatSession,
} from "@google/generative-ai";
import fs from "fs";

let genAI: GoogleGenerativeAI | null = null;

// In-memory cache for PDF base64 to avoid re-reading on each message
const pdfCache = new Map<string, { data: string; timestamp: number }>();
const PDF_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function initGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function uploadPaper(pdfPath: string): Promise<string> {
  if (!genAI) throw new Error("Gemini not initialized");

  // Check cache first
  const cached = pdfCache.get(pdfPath);
  if (cached && Date.now() - cached.timestamp < PDF_CACHE_TTL) {
    return cached.data;
  }

  // Read the PDF file and convert to base64
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Data = pdfBuffer.toString("base64");

  // Cache it
  pdfCache.set(pdfPath, { data: base64Data, timestamp: Date.now() });

  return base64Data;
}

export interface ImageInput {
  data: string; // base64 encoded
  mimeType: string; // image/png, image/jpeg, etc.
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Ask Gemini with full conversation history support.
 * Uses ChatSession for proper multi-turn conversations.
 */
export async function askGemini(
  pdfBase64: string,
  question: string,
  context?: { page?: number; selection?: string },
  modelName: string = "gemini-3-flash-preview",
  images?: ImageInput[],
  chatHistory?: ChatHistoryMessage[]
): Promise<ReadableStream<Uint8Array>> {
  if (!genAI) throw new Error("Gemini not initialized");

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: `You are an AI research assistant helping the user read and understand an academic paper.
The paper has been provided to you. Answer questions clearly and concisely.
When referencing the paper, be specific about sections, pages, or quotes when relevant.
If you're unsure about something, say so rather than making things up.`,
  });

  // Build the conversation history for ChatSession
  // First message includes the PDF as context
  const history: Content[] = [];

  // Add prior conversation history (text only - we don't re-send old images)
  if (chatHistory && chatHistory.length > 0) {
    // Limit to last 20 messages to avoid token limits
    const recentHistory = chatHistory.slice(-20);

    for (const msg of recentHistory) {
      history.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  // Start chat with history
  const chat = model.startChat({
    history,
  });

  // Build the current message parts
  let promptText = question;

  if (context?.selection) {
    promptText = `The user has selected this text from the paper: "${context.selection}"\n\nQuestion: ${question}`;
  } else if (context?.page) {
    promptText = `The user is currently on page ${context.page} of the paper.\n\nQuestion: ${question}`;
  }

  // Build parts array for current message: PDF, images, then text
  const messageParts: Part[] = [
    {
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBase64,
      },
    },
  ];

  // Add any attached images
  if (images && images.length > 0) {
    for (const img of images) {
      const mimeType =
        img.mimeType && img.mimeType.startsWith("image/")
          ? img.mimeType
          : "image/png";
      messageParts.push({
        inlineData: {
          mimeType,
          data: img.data,
        },
      });
    }
  }

  // Add the text prompt
  messageParts.push({ text: promptText });

  // Send message with streaming
  const result = await chat.sendMessageStream(messageParts);

  // Convert to a ReadableStream
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return stream;
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of pdfCache.entries()) {
    if (now - value.timestamp > PDF_CACHE_TTL) {
      pdfCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes
