import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Types for sidecar parsing
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

export interface ChatMessage {
  role: 'user' | 'assistant';
  timestamp: string;
  content: string;
}

export interface SidecarData {
  frontmatter: Frontmatter;
  summary: string;
  insights: string[];
  questions: Question[];
  highlights: Highlight[];
  notes: string;
  chat: ChatMessage[];
}

// Default frontmatter for new sidecars
function createDefaultFrontmatter(pdfFilename: string, title: string): Frontmatter {
  const fm: Frontmatter = {
    title,
    authors: [],
    status: 'reading',
    current_page: 1,
    total_pages: 0,
    date_added: new Date().toISOString().split('T')[0],
    tags: [],
    pdf: pdfFilename,
  };
  // Don't include date_completed for new papers (YAML can't serialize undefined)
  return fm;
}

// Parse a sidecar markdown file
export function parseSidecar(mdPath: string): SidecarData {
  if (!fs.existsSync(mdPath)) {
    throw new Error(`Sidecar not found: ${mdPath}`);
  }

  const content = fs.readFileSync(mdPath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  // Parse sections from body
  const sections = parseSections(body);

  return {
    frontmatter: {
      title: frontmatter.title || '',
      authors: frontmatter.authors || [],
      status: frontmatter.status || 'reading',
      current_page: frontmatter.current_page || 1,
      total_pages: frontmatter.total_pages || 0,
      date_added: frontmatter.date_added || new Date().toISOString().split('T')[0],
      date_completed: frontmatter.date_completed,
      tags: frontmatter.tags || [],
      pdf: frontmatter.pdf || '',
    },
    summary: sections.get('summary') || '',
    insights: parseInsights(sections.get('insights') || ''),
    questions: parseQuestions(sections.get('questions') || ''),
    highlights: parseHighlights(sections.get('highlights') || ''),
    notes: sections.get('notes') || '',
    chat: parseChat(sections.get('chat') || ''),
  };
}

// Parse markdown into sections by ## headers
function parseSections(body: string): Map<string, string> {
  const sections = new Map<string, string>();

  // Split by ## headers (level 2)
  const regex = /^## (.+?)$/gm;
  const parts = body.split(regex);

  // parts[0] is before first ##, then alternating: header, content, header, content...
  for (let i = 1; i < parts.length; i += 2) {
    const header = parts[i].trim().toLowerCase();
    const content = parts[i + 1]?.trim() || '';
    sections.set(header, content);
  }

  return sections;
}

// Parse insights section (bullet list)
function parseInsights(content: string): string[] {
  if (!content) return [];

  return content
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(Boolean);
}

// Parse questions section (checkbox list)
function parseQuestions(content: string): Question[] {
  if (!content) return [];

  return content
    .split('\n')
    .filter(line => line.trim().match(/^-\s*\[[ x]\]/))
    .map(line => {
      const answered = line.includes('[x]');
      const text = line.replace(/^-\s*\[[ x]\]\s*/, '').trim();
      return { text, answered };
    })
    .filter(q => q.text);
}

// Parse highlights section (blockquotes with optional page)
function parseHighlights(content: string): Highlight[] {
  if (!content) return [];

  const highlights: Highlight[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.trim().startsWith('>')) {
      const text = line.replace(/^>\s*/, '').trim();
      // Check for page reference like (p. 5) or (p.5)
      const pageMatch = text.match(/\(p\.?\s*(\d+)\)\s*$/);
      if (pageMatch) {
        highlights.push({
          text: text.replace(/\(p\.?\s*\d+\)\s*$/, '').trim().replace(/^[""]|[""]$/g, ''),
          page: parseInt(pageMatch[1], 10),
        });
      } else {
        highlights.push({
          text: text.replace(/^[""]|[""]$/g, ''),
        });
      }
    }
  }

  return highlights;
}

// Parse chat section
function parseChat(content: string): ChatMessage[] {
  if (!content) return [];

  const messages: ChatMessage[] = [];
  const messageRegex = /\*\*(\w+)\*\*\s*\(([^)]+)\):\s*([\s\S]*?)(?=\*\*\w+\*\*\s*\(|$)/g;

  let match;
  while ((match = messageRegex.exec(content)) !== null) {
    const role = match[1].toLowerCase() as 'user' | 'assistant';
    const timestamp = match[2];
    const messageContent = match[3].trim();

    if (role === 'user' || role === 'assistant') {
      messages.push({ role, timestamp, content: messageContent });
    }
  }

  return messages;
}

// Create a new sidecar file for a PDF
export function createSidecar(pdfPath: string, title?: string): string {
  const pdfFilename = path.basename(pdfPath);
  const mdPath = pdfPath.replace(/\.pdf$/i, '.md');

  const paperTitle = title || path.basename(pdfPath, '.pdf').replace(/-/g, ' ');
  const frontmatter = createDefaultFrontmatter(pdfFilename, paperTitle);

  const content = generateSidecarContent(frontmatter, {
    summary: '',
    insights: [],
    questions: [],
    highlights: [],
    notes: '',
    chat: [],
  });

  fs.writeFileSync(mdPath, content);
  return mdPath;
}

// Generate sidecar markdown content
function generateSidecarContent(
  frontmatter: Frontmatter,
  data: Omit<SidecarData, 'frontmatter'>
): string {
  const fm = matter.stringify('', frontmatter);

  const sections = [
    `# ${frontmatter.title}`,
    '',
    '## Summary',
    data.summary || '',
    '',
    '## Insights',
    data.insights.map(i => `- ${i}`).join('\n') || '',
    '',
    '## Questions',
    data.questions.map(q => `- [${q.answered ? 'x' : ' '}] ${q.text}`).join('\n') || '',
    '',
    '## Highlights',
    data.highlights.map(h => {
      const quote = `> "${h.text}"`;
      return h.page ? `${quote} (p. ${h.page})` : quote;
    }).join('\n') || '',
    '',
    '## Notes',
    data.notes || '',
    '',
    '## Chat',
    data.chat.map(m => `**${m.role}** (${m.timestamp}):\n${m.content}`).join('\n\n') || '',
  ].join('\n');

  return fm + sections;
}

// Update frontmatter in a sidecar file
export function updateFrontmatter(mdPath: string, updates: Partial<Frontmatter>): void {
  const content = fs.readFileSync(mdPath, 'utf-8');
  const { data: currentFm, content: body } = matter(content);

  const newFm = { ...currentFm, ...updates };
  const newContent = matter.stringify(body, newFm);

  fs.writeFileSync(mdPath, newContent);
}

// Append content to a specific section
export function appendToSection(
  mdPath: string,
  section: 'Insights' | 'Questions' | 'Highlights' | 'Notes' | 'Chat' | 'Summary',
  content: string
): void {
  const fileContent = fs.readFileSync(mdPath, 'utf-8');
  const sectionHeader = `## ${section}`;

  const idx = fileContent.indexOf(sectionHeader);
  if (idx === -1) {
    // Section doesn't exist, add it at the end
    const newContent = fileContent.trimEnd() + `\n\n${sectionHeader}\n${content}\n`;
    fs.writeFileSync(mdPath, newContent);
    return;
  }

  // Find end of section (next ## or EOF)
  const afterHeader = idx + sectionHeader.length;
  const nextSection = fileContent.indexOf('\n## ', afterHeader);
  const insertPoint = nextSection === -1 ? fileContent.length : nextSection;

  // Get current section content
  const currentSectionContent = fileContent.slice(afterHeader, insertPoint).trimEnd();

  // Determine if we need a newline prefix
  const prefix = currentSectionContent ? '\n' : '\n';

  const newContent =
    fileContent.slice(0, insertPoint) +
    prefix + content +
    fileContent.slice(insertPoint);

  fs.writeFileSync(mdPath, newContent);
}

// Update an entire section (replace content)
export function updateSection(
  mdPath: string,
  section: 'Insights' | 'Questions' | 'Highlights' | 'Notes' | 'Chat' | 'Summary',
  content: string
): void {
  const fileContent = fs.readFileSync(mdPath, 'utf-8');
  const sectionHeader = `## ${section}`;

  const idx = fileContent.indexOf(sectionHeader);
  if (idx === -1) {
    // Section doesn't exist, add it at the end
    const newContent = fileContent.trimEnd() + `\n\n${sectionHeader}\n${content}\n`;
    fs.writeFileSync(mdPath, newContent);
    return;
  }

  // Find end of section (next ## or EOF)
  const afterHeader = idx + sectionHeader.length;
  const nextSection = fileContent.indexOf('\n## ', afterHeader);
  const endPoint = nextSection === -1 ? fileContent.length : nextSection;

  const newContent =
    fileContent.slice(0, afterHeader) +
    '\n' + content + '\n' +
    fileContent.slice(endPoint);

  fs.writeFileSync(mdPath, newContent);
}

// Write full sidecar data back to file
export function writeSidecar(mdPath: string, data: SidecarData): void {
  const content = generateSidecarContent(data.frontmatter, data);
  fs.writeFileSync(mdPath, content);
}
