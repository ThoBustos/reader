import { NextRequest, NextResponse } from "next/server";
import { getAllPapers, savePaper, deletePaper } from "@/lib/store/papers";
import { Paper } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const papers = getAllPapers();
    return NextResponse.json(papers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to get papers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const paper: Paper = {
      id: uuidv4(),
      title: body.title || "Untitled Paper",
      authors: body.authors || [],
      source: body.source || "",
      filePath: body.filePath,
      dateAdded: new Date().toISOString(),
      status: "queued",
      currentPage: 1,
      totalPages: body.totalPages || 1,
      pass: 1,
      tags: body.tags || [],
    };

    const saved = savePaper(paper);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save paper" }, { status: 500 });
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
    return NextResponse.json({ error: "Failed to delete paper" }, { status: 500 });
  }
}
