import Anthropic from "@anthropic-ai/sdk";

let anthropic: Anthropic | null = null;

export function initClaude(apiKey: string) {
  anthropic = new Anthropic({ apiKey });
}

export async function askClaude(
  documentText: string,
  question: string,
  context?: { page?: number; selection?: string }
): Promise<ReadableStream<Uint8Array>> {
  if (!anthropic) throw new Error("Claude not initialized");

  let prompt = question;

  if (context?.selection) {
    prompt = `The user has selected this text from the paper: "${context.selection}"\n\nQuestion: ${question}`;
  } else if (context?.page) {
    prompt = `The user is currently on page ${context.page} of the paper.\n\nQuestion: ${question}`;
  }

  const systemPrompt = `You are a helpful research assistant. The user is reading an academic paper and asking questions about it. Here is the paper content:

<paper>
${documentText.slice(0, 100000)}
</paper>

Answer questions about this paper concisely and accurately. If you're not sure about something, say so.`;

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
