import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const PAPERS_DIR = path.join(process.cwd(), "public", "papers");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // Ensure papers directory exists
    if (!existsSync(PAPERS_DIR)) {
      await mkdir(PAPERS_DIR, { recursive: true });
    }

    // Generate unique filename
    const fileId = uuidv4();
    const extension = path.extname(file.name);
    const filename = `${fileId}${extension}`;
    const filePath = path.join(PAPERS_DIR, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return relative path for storage
    const relativePath = `papers/${filename}`;

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      originalName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
