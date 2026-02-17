// Paper types - vault-first architecture
export interface Paper {
  id: string;              // hash of PDF path
  title: string;
  authors: string[];
  pdfPath: string;         // absolute path to PDF
  sidecarPath: string;     // absolute path to .md
  status: 'reading' | 'done';
  currentPage: number;
  totalPages: number;
  tags: string[];
  dateAdded: string;
  dateCompleted?: string;
}

// Sidecar types - mirror what's in vault/sidecar.ts for convenience
export interface Frontmatter {
  title: string;
  authors: string[];
  status: 'reading' | 'done';
  current_page: number;
  total_pages: number;
  date_added: string;
  date_completed?: string;
  tags: string[];
  pdf: string;
}

export interface Question {
  text: string;
  answered: boolean;
}

export interface Highlight {
  text: string;
  page?: number;
}

export interface Sidecar {
  frontmatter: Frontmatter;
  summary: string;
  insights: string[];
  questions: Question[];
  highlights: Highlight[];
  notes: string;
  chat: ChatMessage[];
}

// Chat types
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: {
    page?: number;
    selection?: string;
  };
}

export interface ChatSession {
  paperId: string;
  messages: ChatMessage[];
}

// Note types - for API compatibility during transition
export interface PaperNote {
  id: string;
  paperId: string;
  content: string;
  page?: number;
  selection?: string;
  tags: string[];
  createdAt: string;
  type?: 'insight' | 'question' | 'highlight' | 'note';
}

// Settings types
export type Theme = 'classic' | 'ink' | 'paper';
export type Layout = 'sidebar-right' | 'sidebar-left' | 'focus';
export type LLMProvider = 'gemini' | 'claude';
export type GeminiModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'gemini-2.5-flash' | 'gemini-2.5-pro';

export interface Settings {
  theme: Theme;
  layout: Layout;
  llmProvider: LLMProvider;
  geminiModel: GeminiModel;
  vaultPath: string;
  papersPath: string;  // Path to vault/06_READING/Papers folder
  geminiApiKey?: string;
  claudeApiKey?: string;
}

// Context mode for AI
export type ContextMode = 'full-document' | 'current-page' | 'selection';

// Save to doc types
export type SaveToDocType = 'insight' | 'question' | 'highlight' | 'note' | 'summary';
