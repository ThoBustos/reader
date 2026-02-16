import { NextRequest, NextResponse } from "next/server";
import { getPaper, savePaper } from "@/lib/store/papers";

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
    const updated = savePaper({ ...paper, ...body });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update paper" }, { status: 500 });
  }
}
