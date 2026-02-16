// Paper types
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  source?: string;
  filePath: string;
  dateAdded: string;
  status: 'queued' | 'reading' | 'completed';
  currentPage: number;
  totalPages: number;
  pass: 1 | 2 | 3;
  tags: string[];
  notes?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
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

// Note types
export interface PaperNote {
  id: string;
  paperId: string;
  content: string;
  page?: number;
  selection?: string;
  tags: string[];
  createdAt: string;
  pass: 1 | 2 | 3;
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
  geminiApiKey?: string;
  claudeApiKey?: string;
}

// Context mode for AI
export type ContextMode = 'full-document' | 'current-page' | 'selection';
