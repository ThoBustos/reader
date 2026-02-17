import { NextRequest, NextResponse } from "next/server";
import { getPaper } from "@/lib/store/papers";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

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

    const pdfPath = paper.pdfPath;

    if (!existsSync(pdfPath)) {
      return NextResponse.json({ error: "PDF file not found" }, { status: 404 });
    }

    const fileBuffer = await readFile(pdfPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${paper.title}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to serve PDF:", error);
    return NextResponse.json({ error: "Failed to serve PDF" }, { status: 500 });
  }
}
