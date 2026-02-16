import { Paper } from '@/types';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PAPERS_FILE = path.join(DATA_DIR, 'papers.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PAPERS_FILE)) {
    fs.writeFileSync(PAPERS_FILE, JSON.stringify({ papers: [] }));
  }
}

export function getAllPapers(): Paper[] {
  ensureDataDir();
  const data = JSON.parse(fs.readFileSync(PAPERS_FILE, 'utf-8'));
  return data.papers;
}

export function getPaper(id: string): Paper | undefined {
  const papers = getAllPapers();
  return papers.find(p => p.id === id);
}

export function savePaper(paper: Paper): Paper {
  ensureDataDir();
  const papers = getAllPapers();
  const existingIndex = papers.findIndex(p => p.id === paper.id);

  if (existingIndex >= 0) {
    papers[existingIndex] = paper;
  } else {
    papers.push(paper);
  }

  fs.writeFileSync(PAPERS_FILE, JSON.stringify({ papers }, null, 2));
  return paper;
}

export function deletePaper(id: string): boolean {
  const papers = getAllPapers();
  const newPapers = papers.filter(p => p.id !== id);

  if (newPapers.length === papers.length) {
    return false;
  }

  fs.writeFileSync(PAPERS_FILE, JSON.stringify({ papers: newPapers }, null, 2));
  return true;
}

export function updatePaperProgress(id: string, currentPage: number, totalPages?: number): Paper | undefined {
  const paper = getPaper(id);
  if (!paper) return undefined;

  paper.currentPage = currentPage;
  if (totalPages) paper.totalPages = totalPages;

  return savePaper(paper);
}
