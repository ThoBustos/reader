import { Paper, PaperNote } from "@/types";
import fs from "fs";
import path from "path";

const READING_FOLDER = "06_READING";

function ensureReadingStructure(vaultPath: string) {
  const readingPath = path.join(vaultPath, READING_FOLDER);
  const folders = ["Papers", "Daily", "Highlights", "Synthesis"];

  if (!fs.existsSync(readingPath)) {
    fs.mkdirSync(readingPath, { recursive: true });
  }

  for (const folder of folders) {
    const folderPath = path.join(readingPath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  // Create _GUIDE.md if it doesn't exist
  const guidePath = path.join(readingPath, "_GUIDE.md");
  if (!fs.existsSync(guidePath)) {
    fs.writeFileSync(guidePath, GUIDE_TEMPLATE);
  }

  // Create READING.md backlog if it doesn't exist
  const readingMdPath = path.join(readingPath, "READING.md");
  if (!fs.existsSync(readingMdPath)) {
    fs.writeFileSync(readingMdPath, READING_BACKLOG_TEMPLATE);
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export function generatePaperFilename(paper: Paper): string {
  const date = new Date().toISOString().split("T")[0];
  const slug = slugify(paper.title);
  return `${date}-${slug}.md`;
}

export function generatePaperMarkdown(paper: Paper, notes: PaperNote[]): string {
  const passNotes: Record<1 | 2 | 3, PaperNote[]> = { 1: [], 2: [], 3: [] };
  const highlights: PaperNote[] = [];
  const questions: PaperNote[] = [];
  const generalNotes: PaperNote[] = [];

  for (const note of notes) {
    if (note.content.startsWith('"') || note.content.startsWith(">")) {
      highlights.push(note);
    } else if (
      note.content.startsWith("?") ||
      note.content.toLowerCase().includes("question")
    ) {
      questions.push(note);
    } else {
      passNotes[note.pass].push(note);
    }
  }

  return `---
title: "${paper.title}"
authors: [${paper.authors.map((a) => `"${a}"`).join(", ")}]
source: "${paper.source || ""}"
date_read: ${new Date().toISOString().split("T")[0]}
status: ${paper.status}
pass: ${paper.pass}
tags: [${paper.tags.join(", ")}]
---

# ${paper.title}

## Pass 1: Framework
${passNotes[1].map((n) => `- ${n.content}`).join("\n") || "*Not yet completed*"}

## Pass 2: Deep Dive
${passNotes[2].map((n) => `- ${n.content}`).join("\n") || "*Not yet completed*"}

## Pass 3: Critical Analysis
${passNotes[3].map((n) => `- ${n.content}`).join("\n") || "*Not yet completed*"}

## Highlights
${
  highlights
    .map((n) => `- ${n.content}${n.page ? ` (p. ${n.page})` : ""}`)
    .join("\n") || "*No highlights yet*"
}

## Questions
${
  questions.map((n) => `- [ ] ${n.content.replace(/^\??\s*/, "")}`).join("\n") ||
  "*No questions yet*"
}

## My Notes
${generalNotes.map((n) => n.content).join("\n\n") || "*No additional notes*"}
`;
}

export async function saveToVault(
  vaultPath: string,
  paper: Paper,
  notes: PaperNote[]
): Promise<string> {
  ensureReadingStructure(vaultPath);

  const filename = generatePaperFilename(paper);
  const filePath = path.join(vaultPath, READING_FOLDER, "Papers", filename);
  const content = generatePaperMarkdown(paper, notes);

  fs.writeFileSync(filePath, content);
  return filePath;
}

export async function updateReadingBacklog(
  vaultPath: string,
  papers: Paper[]
): Promise<void> {
  const readingMdPath = path.join(vaultPath, READING_FOLDER, "READING.md");

  const queued = papers.filter((p) => p.status === "queued");
  const reading = papers.filter((p) => p.status === "reading");
  const completed = papers.filter((p) => p.status === "completed");

  const content = `---
updated: ${new Date().toISOString().split("T")[0]}
---

# Reading Backlog

## Currently Reading
${
  reading
    .map(
      (p) =>
        `- [[Papers/${generatePaperFilename(p)}|${p.title}]] - Pass ${p.pass}, Page ${p.currentPage}/${p.totalPages}`
    )
    .join("\n") || "*Nothing in progress*"
}

## Queue
${
  queued
    .map((p) => `- [[Papers/${generatePaperFilename(p)}|${p.title}]]`)
    .join("\n") || "*Queue is empty*"
}

## Completed
${
  completed
    .map((p) => `- [[Papers/${generatePaperFilename(p)}|${p.title}]]`)
    .join("\n") || "*No papers completed yet*"
}
`;

  fs.writeFileSync(readingMdPath, content);
}

const GUIDE_TEMPLATE = `# Reading System Guide

This folder contains your reading notes and paper analysis.

## Structure
- **Papers/**: Individual paper notes following the 3-pass method
- **Daily/**: Daily reading logs organized by week
- **Highlights/**: Key excerpts and quotes
- **Synthesis/**: Cross-paper analysis and connections

## 3-Pass Reading Method

### Pass 1: Framework (5-10 min)
- Read: Abstract, intro, conclusion, headings, figures
- Capture: Thesis, main arguments, contribution
- Goal: Summarize in 1-2 sentences

### Pass 2: Deep Dive (30-60 min)
- Read: Beginning/end of each section, highlighted terms
- Capture: Key details, unfamiliar concepts looked up
- Goal: Answer your initial questions

### Pass 3: Critical Analysis (30-60 min)
- Read: Full paper with critical eye
- Capture: Methodology critique, assumptions, connections
- Goal: Form your own view

## Tags
Use consistent tags for cross-referencing:
- #transformers, #attention, #nlp (topic tags)
- #foundational, #survey, #empirical (paper type)
- #must-read, #reference (priority)
`;

const READING_BACKLOG_TEMPLATE = `---
updated: ${new Date().toISOString().split("T")[0]}
---

# Reading Backlog

## Currently Reading
*Nothing in progress*

## Queue
*Queue is empty*

## Completed
*No papers completed yet*
`;
