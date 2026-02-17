import { Paper } from '@/types';
import { getSettings } from './settings';
import fs from 'fs';
import path from 'path';
import {
  scanPapersFolder,
  findPaper,
  addPaper as vaultAddPaper,
  deletePaper as vaultDeletePaper,
  updateFrontmatter,
  type Paper as VaultPaper,
} from '@/lib/vault';

// Cache for papers to avoid rescanning on every request
let papersCache: Paper[] | null = null;
let lastScanTime = 0;
const CACHE_TTL = 5000; // 5 seconds

// Invalidate cache
export function invalidateCache(): void {
  papersCache = null;
  lastScanTime = 0;
}

// Get the papers folder path (vault or local fallback)
function getPapersPath(): string {
  const settings = getSettings();
  return settings.papersPath || path.join(process.cwd(), 'papers');
}

// Get all papers from vault
export function getAllPapers(): Paper[] {
  const now = Date.now();
  if (papersCache && (now - lastScanTime) < CACHE_TTL) {
    return papersCache;
  }

  const papersPath = getPapersPath();

  // If folder doesn't exist yet, return empty
  if (!fs.existsSync(papersPath)) {
    return [];
  }

  papersCache = scanPapersFolder(papersPath);
  lastScanTime = now;
  return papersCache;
}

// Get a single paper by ID
export function getPaper(id: string): Paper | undefined {
  const papers = getAllPapers();
  return papers.find(p => p.id === id);
}

// Add a new paper (copy to vault and create sidecar)
export function savePaper(
  sourcePdfPath: string,
  title: string,
  authors: string[] = [],
  tags: string[] = []
): Paper {
  const papersPath = getPapersPath();

  // Ensure folder exists
  if (!fs.existsSync(papersPath)) {
    fs.mkdirSync(papersPath, { recursive: true });
  }

  const paper = vaultAddPaper(papersPath, sourcePdfPath, title, authors);

  // Update tags if provided
  if (tags.length > 0) {
    updateFrontmatter(paper.sidecarPath, { tags });
  }

  invalidateCache();
  return paper;
}

// Delete a paper
export function deletePaper(id: string): boolean {
  const paper = getPaper(id);
  if (!paper) return false;

  const result = vaultDeletePaper(paper);
  if (result) {
    invalidateCache();
  }
  return result;
}

// Update paper progress
export function updatePaperProgress(
  id: string,
  currentPage: number,
  totalPages?: number
): Paper | undefined {
  const paper = getPaper(id);
  if (!paper) return undefined;

  const updates: Record<string, unknown> = { current_page: currentPage };
  if (totalPages !== undefined) {
    updates.total_pages = totalPages;
  }

  updateFrontmatter(paper.sidecarPath, updates);
  invalidateCache();

  return getPaper(id);
}

// Update paper status
export function updatePaperStatus(id: string, status: 'reading' | 'done'): Paper | undefined {
  const paper = getPaper(id);
  if (!paper) return undefined;

  const updates: Record<string, unknown> = { status };
  if (status === 'done') {
    updates.date_completed = new Date().toISOString().split('T')[0];
  } else {
    updates.date_completed = undefined;
  }

  updateFrontmatter(paper.sidecarPath, updates);
  invalidateCache();

  return getPaper(id);
}

// Update paper metadata
export function updatePaperMetadata(
  id: string,
  updates: {
    title?: string;
    authors?: string[];
    tags?: string[];
  }
): Paper | undefined {
  const paper = getPaper(id);
  if (!paper) return undefined;

  updateFrontmatter(paper.sidecarPath, updates);
  invalidateCache();

  return getPaper(id);
}
