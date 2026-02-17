import { NextRequest, NextResponse } from "next/server";
import { getPaper } from "@/lib/store/papers";
import {
  parseSidecar,
  appendToSection,
  updateSection,
} from "@/lib/vault";

// GET - Get all notes for a paper from sidecar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get("paperId");

    if (!paperId) {
      return NextResponse.json({ error: "Paper ID required" }, { status: 400 });
    }

    const paper = getPaper(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const sidecar = parseSidecar(paper.sidecarPath);

    return NextResponse.json({
      summary: sidecar.summary,
      insights: sidecar.insights,
      questions: sidecar.questions,
      highlights: sidecar.highlights,
      notes: sidecar.notes,
    });
  } catch (error) {
    console.error("Failed to get notes:", error);
    return NextResponse.json({ error: "Failed to get notes" }, { status: 500 });
  }
}

// POST - Add content to a specific section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperId, section, content, page } = body;

    if (!paperId || !section || !content) {
      return NextResponse.json(
        { error: "Paper ID, section, and content required" },
        { status: 400 }
      );
    }

    const paper = getPaper(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Format content based on section type
    let formatted: string;
    switch (section) {
      case "insight":
      case "insights":
        formatted = `- ${content}`;
        appendToSection(paper.sidecarPath, "Insights", formatted);
        break;
      case "question":
      case "questions":
        formatted = `- [ ] ${content}`;
        appendToSection(paper.sidecarPath, "Questions", formatted);
        break;
      case "highlight":
      case "highlights":
        formatted = page ? `> "${content}" (p. ${page})` : `> "${content}"`;
        appendToSection(paper.sidecarPath, "Highlights", formatted);
        break;
      case "note":
      case "notes":
        appendToSection(paper.sidecarPath, "Notes", content);
        break;
      case "summary":
        updateSection(paper.sidecarPath, "Summary", content);
        break;
      default:
        return NextResponse.json(
          { error: `Invalid section: ${section}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save note:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}

// PUT - Update an entire section (replace content)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperId, section, content } = body;

    if (!paperId || !section) {
      return NextResponse.json(
        { error: "Paper ID and section required" },
        { status: 400 }
      );
    }

    const paper = getPaper(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Map section names to proper casing
    const sectionMap: Record<string, "Summary" | "Insights" | "Questions" | "Highlights" | "Notes" | "Chat"> = {
      summary: "Summary",
      insights: "Insights",
      questions: "Questions",
      highlights: "Highlights",
      notes: "Notes",
      chat: "Chat",
    };

    const sidecarSection = sectionMap[section.toLowerCase()];
    if (!sidecarSection) {
      return NextResponse.json(
        { error: `Invalid section: ${section}` },
        { status: 400 }
      );
    }

    updateSection(paper.sidecarPath, sidecarSection, content || "");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update section:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}
