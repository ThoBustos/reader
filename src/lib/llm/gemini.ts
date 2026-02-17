import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import fs from "fs";
import path from "path";

let genAI: GoogleGenerativeAI | null = null;

export function initGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function uploadPaper(pdfPath: string): Promise<string> {
  if (!genAI) throw new Error("Gemini not initialized");

  // Read the PDF file and convert to base64
  // pdfPath is already an absolute path from the vault
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Data = pdfBuffer.toString("base64");

  return base64Data;
}

export async function askGemini(
  pdfBase64: string,
  question: string,
  context?: { page?: number; selection?: string },
  modelName: string = "gemini-3-flash-preview"
): Promise<ReadableStream<Uint8Array>> {
  if (!genAI) throw new Error("Gemini not initialized");

  const model = genAI.getGenerativeModel({ model: modelName });

  let prompt = question;

  if (context?.selection) {
    prompt = `The user has selected this text from the paper: "${context.selection}"\n\nQuestion: ${question}`;
  } else if (context?.page) {
    prompt = `The user is currently on page ${context.page} of the paper.\n\nQuestion: ${question}`;
  }

  const parts: Part[] = [
    {
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBase64,
      },
    },
    { text: prompt },
  ];

  const result = await model.generateContentStream(parts);

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

