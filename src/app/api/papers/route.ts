import { NextRequest, NextResponse } from "next/server";
import { getAllPapers, savePaper, deletePaper } from "@/lib/store/papers";

export async function GET() {
  try {
    const papers = getAllPapers();
    return NextResponse.json(papers);
  } catch (error) {
    console.error("Failed to get papers:", error);
    return NextResponse.json({ error: "Failed to get papers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourcePath, title, authors, tags } = body;

    console.log("POST /api/papers:", { sourcePath, title, authors, tags });

    if (!sourcePath || !title) {
      return NextResponse.json(
        { error: "Source path and title required" },
        { status: 400 }
      );
    }

    const paper = savePaper(sourcePath, title, authors || [], tags || []);
    console.log("Paper created:", paper);
    return NextResponse.json(paper);
  } catch (error) {
    console.error("Failed to save paper:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to save paper: ${message}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Paper ID required" }, { status: 400 });
    }

    const deleted = deletePaper(id);
    if (!deleted) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete paper:", error);
    return NextResponse.json({ error: "Failed to delete paper" }, { status: 500 });
  }
}
