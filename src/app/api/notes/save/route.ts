import { NextRequest, NextResponse } from "next/server";
import { getPaper } from "@/lib/store/papers";
import {
  appendToSection,
  updateSection,
} from "@/lib/vault";

// "Save to doc" endpoint - used by chat buttons to save AI responses to sidecar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperId, type, content, page } = body;

    if (!paperId || !type || !content) {
      return NextResponse.json(
        { error: "Paper ID, type, and content required" },
        { status: 400 }
      );
    }

    const paper = getPaper(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    switch (type) {
      case "insight":
        appendToSection(paper.sidecarPath, "Insights", `- ${content}`);
        break;

      case "question":
        appendToSection(paper.sidecarPath, "Questions", `- [ ] ${content}`);
        break;

      case "highlight":
        const formatted = page ? `> "${content}" (p. ${page})` : `> "${content}"`;
        appendToSection(paper.sidecarPath, "Highlights", formatted);
        break;

      case "note":
        appendToSection(paper.sidecarPath, "Notes", content);
        break;

      case "summary":
        updateSection(paper.sidecarPath, "Summary", content);
        break;

      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save to doc error:", error);
    return NextResponse.json(
      { error: "Failed to save to doc" },
      { status: 500 }
    );
  }
}
