// Main vault interface - combines scanner and sidecar functionality
// Re-exports for convenient imports

export {
  type Paper,
  generatePaperId,
  scanPapersFolder,
  findPaper,
  getPapersByStatus,
  slugify,
  addPaper,
  deletePaper,
} from './scanner';

export {
  type Frontmatter,
  type Question,
  type Highlight,
  type ChatMessage,
  type SidecarData,
  parseSidecar,
  createSidecar,
  updateFrontmatter,
  appendToSection,
  updateSection,
  writeSidecar,
} from './sidecar';

// High-level convenience functions

import { findPaper, type Paper } from './scanner';
import {
  parseSidecar,
  updateFrontmatter,
  appendToSection,
  type SidecarData,
  type ChatMessage,
} from './sidecar';

// Save paper reading progress
export function savePaperProgress(
  papersPath: string,
  paperId: string,
  currentPage: number,
  totalPages?: number
): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  const updates: Record<string, unknown> = { current_page: currentPage };
  if (totalPages !== undefined) {
    updates.total_pages = totalPages;
  }

  updateFrontmatter(paper.sidecarPath, updates);
  return true;
}

// Mark paper as done
export function markPaperDone(papersPath: string, paperId: string): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  updateFrontmatter(paper.sidecarPath, {
    status: 'done',
    date_completed: new Date().toISOString().split('T')[0],
  });
  return true;
}

// Mark paper as reading (reopen)
export function markPaperReading(papersPath: string, paperId: string): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  updateFrontmatter(paper.sidecarPath, {
    status: 'reading',
    date_completed: undefined,
  });
  return true;
}

// Add an insight to a paper
export function saveInsight(papersPath: string, paperId: string, content: string): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  appendToSection(paper.sidecarPath, 'Insights', `- ${content}`);
  return true;
}

// Add a question to a paper
export function saveQuestion(papersPath: string, paperId: string, content: string): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  appendToSection(paper.sidecarPath, 'Questions', `- [ ] ${content}`);
  return true;
}

// Add a highlight to a paper
export function saveHighlight(
  papersPath: string,
  paperId: string,
  content: string,
  page?: number
): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  const formatted = page ? `> "${content}" (p. ${page})` : `> "${content}"`;
  appendToSection(paper.sidecarPath, 'Highlights', formatted);
  return true;
}

// Add a note to a paper
export function saveNote(papersPath: string, paperId: string, content: string): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  appendToSection(paper.sidecarPath, 'Notes', content);
  return true;
}

// Save a chat message to a paper's sidecar
export function saveChatMessage(
  papersPath: string,
  paperId: string,
  message: ChatMessage
): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  const formatted = `**${message.role}** (${message.timestamp}):\n${message.content}\n`;
  appendToSection(paper.sidecarPath, 'Chat', formatted);
  return true;
}

// Get all sidecar data for a paper
export function getPaperSidecar(papersPath: string, paperId: string): SidecarData | null {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return null;

  try {
    return parseSidecar(paper.sidecarPath);
  } catch {
    return null;
  }
}

// Update paper tags
export function updatePaperTags(papersPath: string, paperId: string, tags: string[]): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  updateFrontmatter(paper.sidecarPath, { tags });
  return true;
}

// Update paper title
export function updatePaperTitle(papersPath: string, paperId: string, title: string): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  updateFrontmatter(paper.sidecarPath, { title });
  return true;
}

// Update paper authors
export function updatePaperAuthors(papersPath: string, paperId: string, authors: string[]): boolean {
  const paper = findPaper(papersPath, paperId);
  if (!paper) return false;

  updateFrontmatter(paper.sidecarPath, { authors });
  return true;
}

// Get related papers (by shared tags)
export function getRelatedPapers(
  papersPath: string,
  paperId: string,
  allPapers: Paper[]
): Paper[] {
  const paper = allPapers.find(p => p.id === paperId);
  if (!paper || paper.tags.length === 0) return [];

  return allPapers
    .filter(p => p.id !== paperId)
    .filter(p => p.tags.some(tag => paper.tags.includes(tag)))
    .slice(0, 5); // Limit to 5 related papers
}
