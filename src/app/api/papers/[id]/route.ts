import { NextRequest, NextResponse } from "next/server";
import {
  getPaper,
  updatePaperProgress,
  updatePaperStatus,
  updatePaperMetadata,
} from "@/lib/store/papers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paper = getPaper(id);

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    return NextResponse.json(paper);
  } catch (error) {
    console.error("Failed to get paper:", error);
    return NextResponse.json({ error: "Failed to get paper" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paper = getPaper(id);

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const body = await request.json();
    let updated = paper;

    // Handle progress updates
    if (body.currentPage !== undefined || body.totalPages !== undefined) {
      const result = updatePaperProgress(
        id,
        body.currentPage ?? paper.currentPage,
        body.totalPages ?? paper.totalPages
      );
      if (result) updated = result;
    }

    // Handle status updates
    if (body.status !== undefined) {
      const result = updatePaperStatus(id, body.status);
      if (result) updated = result;
    }

    // Handle metadata updates
    const metadataFields: { title?: string; authors?: string[]; tags?: string[] } = {};
    if (body.title !== undefined) metadataFields.title = body.title;
    if (body.authors !== undefined) metadataFields.authors = body.authors;
    if (body.tags !== undefined) metadataFields.tags = body.tags;

    if (Object.keys(metadataFields).length > 0) {
      const result = updatePaperMetadata(id, metadataFields);
      if (result) updated = result;
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update paper:", error);
    return NextResponse.json({ error: "Failed to update paper" }, { status: 500 });
  }
}
