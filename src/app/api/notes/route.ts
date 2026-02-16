import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/store/settings";
import { getPaper, getAllPapers } from "@/lib/store/papers";
import { saveToVault, updateReadingBacklog } from "@/lib/vault/writer";
import { PaperNote } from "@/types";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const NOTES_DIR = path.join(DATA_DIR, "notes");

function ensureNotesDir() {
  if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR, { recursive: true });
  }
}

function getNotesFilePath(paperId: string): string {
  return path.join(NOTES_DIR, `${paperId}.json`);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get("paperId");

    if (!paperId) {
      return NextResponse.json({ error: "Paper ID required" }, { status: 400 });
    }

    ensureNotesDir();
    const filePath = getNotesFilePath(paperId);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ notes: [] });
    }

    const notes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperId, note } = body;

    if (!paperId || !note) {
      return NextResponse.json(
        { error: "Paper ID and note required" },
        { status: 400 }
      );
    }

    ensureNotesDir();
    const filePath = getNotesFilePath(paperId);

    let notes: PaperNote[] = [];
    if (fs.existsSync(filePath)) {
      notes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }

    notes.push(note);
    fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));

    return NextResponse.json({ success: true, note });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}

// Save to vault endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperId } = body;

    if (!paperId) {
      return NextResponse.json({ error: "Paper ID required" }, { status: 400 });
    }

    const settings = getSettings();
    if (!settings.vaultPath) {
      return NextResponse.json(
        { error: "Vault path not configured. Please set it in settings." },
        { status: 400 }
      );
    }

    // Verify vault path exists
    if (!fs.existsSync(settings.vaultPath)) {
      return NextResponse.json(
        { error: "Vault path does not exist" },
        { status: 400 }
      );
    }

    const paper = getPaper(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Get notes for this paper
    ensureNotesDir();
    const notesFilePath = getNotesFilePath(paperId);
    let notes: PaperNote[] = [];
    if (fs.existsSync(notesFilePath)) {
      notes = JSON.parse(fs.readFileSync(notesFilePath, "utf-8"));
    }

    // Save to vault
    const savedPath = await saveToVault(settings.vaultPath, paper, notes);

    // Update reading backlog
    const allPapers = getAllPapers();
    await updateReadingBacklog(settings.vaultPath, allPapers);

    return NextResponse.json({ success: true, path: savedPath });
  } catch (error) {
    console.error("Save to vault error:", error);
    return NextResponse.json(
      { error: "Failed to save to vault" },
      { status: 500 }
    );
  }
}
