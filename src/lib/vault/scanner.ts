import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createSidecar, parseSidecar, type Frontmatter } from './sidecar';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  pdfPath: string;
  sidecarPath: string;
  status: 'reading' | 'done';
  currentPage: number;
  totalPages: number;
  tags: string[];
  dateAdded: string;
  dateCompleted?: string;
}

// Generate a stable ID from PDF path
export function generatePaperId(pdfPath: string): string {
  return crypto.createHash('sha256').update(pdfPath).digest('hex').slice(0, 12);
}

// Scan a folder for PDFs and their sidecars
export function scanPapersFolder(papersPath: string): Paper[] {
  if (!papersPath || !fs.existsSync(papersPath)) {
    return [];
  }

  const papers: Paper[] = [];
  const files = fs.readdirSync(papersPath);

  // Find all PDFs
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(papersPath, pdfFile);
    const sidecarPath = pdfPath.replace(/\.pdf$/i, '.md');

    // Auto-create sidecar if missing
    if (!fs.existsSync(sidecarPath)) {
      createSidecar(pdfPath);
    }

    try {
      const sidecar = parseSidecar(sidecarPath);
      const paper = frontmatterToPaper(sidecar.frontmatter, pdfPath, sidecarPath);
      papers.push(paper);
    } catch (error) {
      console.error(`Failed to parse sidecar for ${pdfFile}:`, error);
      // Create a minimal paper entry even if sidecar parsing fails
      papers.push({
        id: generatePaperId(pdfPath),
        title: path.basename(pdfFile, '.pdf').replace(/-/g, ' '),
        authors: [],
        pdfPath,
        sidecarPath,
        status: 'reading',
        currentPage: 1,
        totalPages: 0,
        tags: [],
        dateAdded: new Date().toISOString().split('T')[0],
      });
    }
  }

  // Sort by date added, newest first
  papers.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

  return papers;
}

// Convert frontmatter to Paper object
function frontmatterToPaper(
  frontmatter: Frontmatter,
  pdfPath: string,
  sidecarPath: string
): Paper {
  return {
    id: generatePaperId(pdfPath),
    title: frontmatter.title,
    authors: frontmatter.authors,
    pdfPath,
    sidecarPath,
    status: frontmatter.status,
    currentPage: frontmatter.current_page,
    totalPages: frontmatter.total_pages,
    tags: frontmatter.tags,
    dateAdded: frontmatter.date_added,
    dateCompleted: frontmatter.date_completed,
  };
}

// Find a specific paper by ID
export function findPaper(papersPath: string, id: string): Paper | undefined {
  const papers = scanPapersFolder(papersPath);
  return papers.find(p => p.id === id);
}

// Get papers by status
export function getPapersByStatus(
  papersPath: string,
  status: 'reading' | 'done'
): Paper[] {
  const papers = scanPapersFolder(papersPath);
  return papers.filter(p => p.status === status);
}

// Utility: slugify a title for filename
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// Create a new paper by copying PDF to vault and creating sidecar
export function addPaper(
  papersPath: string,
  sourcePdfPath: string,
  title: string,
  authors: string[] = []
): Paper {
  // Generate filename from title
  const pdfFilename = slugify(title) + '.pdf';
  const destPdfPath = path.join(papersPath, pdfFilename);

  // Ensure papers folder exists
  if (!fs.existsSync(papersPath)) {
    fs.mkdirSync(papersPath, { recursive: true });
  }

  // Copy PDF to vault
  fs.copyFileSync(sourcePdfPath, destPdfPath);

  // Create sidecar with proper title and authors
  const sidecarPath = createSidecar(destPdfPath, title);

  // Update frontmatter with authors if provided
  if (authors.length > 0) {
    const { updateFrontmatter } = require('./sidecar');
    updateFrontmatter(sidecarPath, { authors });
  }

  return {
    id: generatePaperId(destPdfPath),
    title,
    authors,
    pdfPath: destPdfPath,
    sidecarPath,
    status: 'reading',
    currentPage: 1,
    totalPages: 0,
    tags: [],
    dateAdded: new Date().toISOString().split('T')[0],
  };
}

// Delete a paper and its sidecar
export function deletePaper(paper: Paper): boolean {
  try {
    if (fs.existsSync(paper.pdfPath)) {
      fs.unlinkSync(paper.pdfPath);
    }
    if (fs.existsSync(paper.sidecarPath)) {
      fs.unlinkSync(paper.sidecarPath);
    }
    return true;
  } catch (error) {
    console.error('Failed to delete paper:', error);
    return false;
  }
}
