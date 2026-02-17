# Implementation Plan: Vault-First Architecture

## Overview

Transform Reader from JSON-based storage to Obsidian vault as the single source of truth.

**Current:** App → JSON files → Manual export to vault
**Target:** Vault → App reads/writes directly → No JSON

---

## File Change Map

### DELETE (no longer needed)

| File | Reason |
|------|--------|
| `data/papers.json` | Replaced by vault scan |
| `data/notes/*.json` | Replaced by sidecar notes |
| `data/chats/*.json` | Replaced by sidecar ## Chat |
| `data/papers/*.pdf` | PDFs live in vault |

---

### NEW FILES

#### `src/lib/vault/scanner.ts`
Scan vault folder for PDFs and their sidecars.

```typescript
// Functions needed:
scanPapersFolder(vaultPath: string): Paper[]
watchPapersFolder(vaultPath: string, onChange: () => void): void
```

#### `src/lib/vault/sidecar.ts`
Parse and write sidecar markdown files.

```typescript
// Functions needed:
parseSidecar(mdPath: string): SidecarData
writeSidecar(mdPath: string, data: SidecarData): void
createSidecar(pdfPath: string, title: string): string
updateFrontmatter(mdPath: string, updates: Partial<Frontmatter>): void
appendToSection(mdPath: string, section: string, content: string): void
```

#### `src/lib/vault/index.ts`
Main vault interface combining scanner + sidecar.

```typescript
// Functions needed:
initVault(papersPath: string): VaultState
getPaper(id: string): Paper | undefined
getAllPapers(): Paper[]
savePaperProgress(id: string, page: number): void
saveInsight(paperId: string, content: string): void
saveQuestion(paperId: string, content: string): void
saveHighlight(paperId: string, content: string, page?: number): void
saveNote(paperId: string, content: string): void
saveChatMessage(paperId: string, message: ChatMessage): void
getRelatedPapers(paperId: string): Paper[]
```

---

### MODIFY FILES

#### `src/types/index.ts`

```typescript
// REMOVE
pass: 1 | 2 | 3;  // No longer tracking passes in UI

// CHANGE
status: 'queued' | 'reading' | 'completed'  →  status: 'reading' | 'done'

// ADD
export interface Sidecar {
  frontmatter: Frontmatter;
  summary: string;
  insights: string[];
  questions: Question[];
  highlights: Highlight[];
  notes: string;
  chat: ChatMessage[];
}

export interface Frontmatter {
  title: string;
  authors: string[];
  status: 'reading' | 'done';
  current_page: number;
  total_pages: number;
  date_added: string;
  date_completed?: string;
  tags: string[];
  pdf: string;  // filename of PDF
}

export interface Question {
  text: string;
  answered: boolean;
  answer?: string;
}

export interface Highlight {
  text: string;
  page?: number;
}

// CHANGE Paper interface
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
}
```

#### `src/lib/store/settings.ts`

```typescript
// ADD to Settings interface
papersPath: string;  // Path to vault/06_READING/Papers folder

// REMOVE (merged into papersPath)
// vaultPath stays but papersPath is the primary config
```

#### `src/lib/store/papers.ts`
**Complete rewrite** - use vault/scanner.ts instead of JSON.

```typescript
import { scanPapersFolder } from '@/lib/vault/scanner';
import { getSettings } from './settings';

let papersCache: Paper[] | null = null;

export function getAllPapers(): Paper[] {
  if (!papersCache) {
    const settings = getSettings();
    papersCache = scanPapersFolder(settings.papersPath);
  }
  return papersCache;
}

export function getPaper(id: string): Paper | undefined {
  return getAllPapers().find(p => p.id === id);
}

export function invalidateCache(): void {
  papersCache = null;
}

// savePaper, deletePaper - delegate to vault/sidecar.ts
```

#### `src/lib/store/chat.ts`
**Complete rewrite** - save to sidecar instead of JSON.

```typescript
import { appendToSection, parseSidecar } from '@/lib/vault/sidecar';

export function getChatSession(paperId: string): ChatSession {
  const paper = getPaper(paperId);
  if (!paper) return { paperId, messages: [] };

  const sidecar = parseSidecar(paper.sidecarPath);
  return { paperId, messages: sidecar.chat };
}

export function saveChatMessage(paperId: string, message: ChatMessage): void {
  const paper = getPaper(paperId);
  if (!paper) return;

  // Append to ## Chat section in sidecar
  const formatted = `**${message.role}** (${message.timestamp}):\n${message.content}\n`;
  appendToSection(paper.sidecarPath, 'Chat', formatted);
}
```

#### `src/lib/vault/writer.ts`
**DELETE or simplify** - no longer needed for export, sidecar IS the note.

---

### API ROUTES

#### `src/app/api/papers/route.ts`

```typescript
// GET - use vault scanner
export async function GET() {
  const papers = getAllPapers();
  return NextResponse.json(papers);
}

// POST - copy PDF to vault, create sidecar
export async function POST(request: NextRequest) {
  const { filePath, title } = await request.json();
  const settings = getSettings();

  // Copy PDF to vault/06_READING/Papers/
  const pdfName = slugify(title) + '.pdf';
  const destPath = path.join(settings.papersPath, pdfName);
  fs.copyFileSync(filePath, destPath);

  // Create sidecar
  const sidecarPath = createSidecar(destPath, title);

  invalidateCache();
  return NextResponse.json({ success: true });
}

// DELETE - remove PDF and sidecar from vault
```

#### `src/app/api/papers/[id]/route.ts`
Update progress → write to sidecar frontmatter.

#### `src/app/api/notes/route.ts`
**Complete rewrite** - read/write sidecar sections.

```typescript
// GET - parse sidecar, return structured notes
export async function GET(request: NextRequest) {
  const paperId = searchParams.get("paperId");
  const paper = getPaper(paperId);
  const sidecar = parseSidecar(paper.sidecarPath);

  return NextResponse.json({
    summary: sidecar.summary,
    insights: sidecar.insights,
    questions: sidecar.questions,
    highlights: sidecar.highlights,
    notes: sidecar.notes,
  });
}

// POST - append to specific section
export async function POST(request: NextRequest) {
  const { paperId, section, content } = await request.json();
  // section: 'insight' | 'question' | 'highlight' | 'note'

  const paper = getPaper(paperId);
  appendToSection(paper.sidecarPath, section, content);

  return NextResponse.json({ success: true });
}

// PUT - no longer needed (no "save to vault" - we ARE the vault)
```

#### `src/app/api/chat/route.ts`
Already saves messages. Update to write to sidecar instead.

#### `src/app/api/upload/route.ts`
Change destination from `data/papers/` to vault papers folder.

#### NEW: `src/app/api/notes/save/route.ts`
Handle "save to doc" commands from chat.

```typescript
export async function POST(request: NextRequest) {
  const { paperId, type, content, page } = await request.json();
  // type: 'insight' | 'question' | 'highlight' | 'note' | 'summary'

  const paper = getPaper(paperId);

  switch (type) {
    case 'insight':
      appendToSection(paper.sidecarPath, 'Insights', `- ${content}`);
      break;
    case 'question':
      appendToSection(paper.sidecarPath, 'Questions', `- [ ] ${content}`);
      break;
    case 'highlight':
      const formatted = page ? `> ${content} (p. ${page})` : `> ${content}`;
      appendToSection(paper.sidecarPath, 'Highlights', formatted);
      break;
    case 'note':
      appendToSection(paper.sidecarPath, 'Notes', content);
      break;
    case 'summary':
      updateSection(paper.sidecarPath, 'Summary', content);
      break;
  }

  return NextResponse.json({ success: true });
}
```

---

### COMPONENTS

#### `src/components/chat/ChatPanel.tsx`

**ADD: Save buttons on AI responses**
```tsx
{message.role === 'assistant' && (
  <div className="flex gap-1 mt-2">
    <Button size="sm" onClick={() => saveToDoc('insight', message.content)}>
      + Insight
    </Button>
    <Button size="sm" onClick={() => saveToDoc('question', message.content)}>
      + Question
    </Button>
    <Button size="sm" onClick={() => saveToDoc('note', message.content)}>
      + Note
    </Button>
  </div>
)}
```

**ADD: Natural language command detection**
```typescript
const SAVE_COMMANDS = [
  { pattern: /^save (that |this )?(as )?insight/i, type: 'insight' },
  { pattern: /^save (that |this )?(as )?question/i, type: 'question' },
  { pattern: /^save (that |this )?(to )?notes?/i, type: 'note' },
  { pattern: /^add question:?\s*(.+)/i, type: 'question', extract: true },
  { pattern: /^highlight:?\s*(.+)/i, type: 'highlight', extract: true },
];

function detectSaveCommand(input: string): SaveCommand | null {
  for (const cmd of SAVE_COMMANDS) {
    const match = input.match(cmd.pattern);
    if (match) {
      return { type: cmd.type, content: cmd.extract ? match[1] : lastAssistantMessage };
    }
  }
  return null;
}
```

#### `src/components/notes/NotesPanel.tsx`

**Complete rewrite** - show sidecar sections as editable document.

```tsx
export function NotesPanel({ paperId }: { paperId: string }) {
  const [sidecar, setSidecar] = useState<Sidecar | null>(null);

  // Load sidecar on mount
  useEffect(() => {
    fetch(`/api/notes?paperId=${paperId}`)
      .then(res => res.json())
      .then(setSidecar);
  }, [paperId]);

  return (
    <div className="flex flex-col h-full">
      {/* Summary */}
      <Section title="Summary">
        <Textarea
          value={sidecar?.summary}
          onChange={(e) => updateSection('summary', e.target.value)}
        />
      </Section>

      {/* Insights */}
      <Section title="Insights">
        <BulletList
          items={sidecar?.insights}
          onAdd={(item) => addToSection('insight', item)}
        />
      </Section>

      {/* Questions */}
      <Section title="Questions">
        <Checklist
          items={sidecar?.questions}
          onToggle={(idx) => toggleQuestion(idx)}
          onAdd={(item) => addToSection('question', item)}
        />
      </Section>

      {/* Highlights */}
      <Section title="Highlights">
        <QuoteList items={sidecar?.highlights} />
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <Textarea
          value={sidecar?.notes}
          onChange={(e) => updateSection('notes', e.target.value)}
        />
      </Section>
    </div>
  );
}
```

**REMOVE:**
- Pass-based note organization
- "Save to Vault" button (we ARE the vault)
- Tag input per note (tags are on paper level)

#### `src/components/library/LibraryView.tsx`

**CHANGE:**
- Status filters: `All | Reading | Done` (remove Queued/Completed)
- Remove Pass badge from cards
- Upload still works but copies to vault folder

#### `src/app/read/[id]/page.tsx`

**CHANGE:**
- Remove Pass 1/2/3 switcher
- Add simple progress indicator or just page count
- Remove "Completed" button (status changes to 'done' manually or via command)

#### `src/app/settings/page.tsx`

**ADD:**
- `papersPath` input (path to vault/06_READING/Papers)
- Could be derived from vaultPath or set separately

---

## Sidecar Markdown Parser

The core of this refactor. Need robust markdown parsing.

### Parse Structure

```typescript
interface ParsedSidecar {
  frontmatter: Record<string, any>;
  sections: Map<string, string>;
}

function parseSidecar(filePath: string): ParsedSidecar {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract frontmatter (between --- markers)
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = fmMatch ? yaml.parse(fmMatch[1]) : {};

  // Extract sections (## Heading followed by content)
  const sections = new Map<string, string>();
  const sectionRegex = /^## (.+)\n([\s\S]*?)(?=^## |\Z)/gm;
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.set(match[1].toLowerCase(), match[2].trim());
  }

  return { frontmatter, sections };
}
```

### Write Structure

```typescript
function appendToSection(filePath: string, section: string, content: string): void {
  const current = fs.readFileSync(filePath, 'utf-8');
  const sectionHeader = `## ${section}`;

  const idx = current.indexOf(sectionHeader);
  if (idx === -1) {
    // Section doesn't exist, add it
    fs.appendFileSync(filePath, `\n\n${sectionHeader}\n${content}\n`);
  } else {
    // Find end of section (next ## or EOF)
    const nextSection = current.indexOf('\n## ', idx + sectionHeader.length);
    const insertPoint = nextSection === -1 ? current.length : nextSection;

    const newContent =
      current.slice(0, insertPoint) +
      '\n' + content +
      current.slice(insertPoint);

    fs.writeFileSync(filePath, newContent);
  }
}
```

---

## Implementation Order

### Phase 1: Core Vault Layer (Day 1)
1. [ ] Create `src/lib/vault/sidecar.ts` - parse/write sidecar markdown
2. [ ] Create `src/lib/vault/scanner.ts` - scan folder for PDFs
3. [ ] Create `src/lib/vault/index.ts` - main interface
4. [ ] Update `src/types/index.ts` - new types

### Phase 2: Storage Migration (Day 1-2)
5. [ ] Rewrite `src/lib/store/papers.ts` - use vault scanner
6. [ ] Rewrite `src/lib/store/chat.ts` - save to sidecar
7. [ ] Update `src/lib/store/settings.ts` - add papersPath
8. [ ] Delete `src/lib/vault/writer.ts` - no longer needed

### Phase 3: API Routes (Day 2)
9. [ ] Update `src/app/api/papers/route.ts` - vault-based
10. [ ] Update `src/app/api/papers/[id]/route.ts` - sidecar frontmatter
11. [ ] Rewrite `src/app/api/notes/route.ts` - sidecar sections
12. [ ] Update `src/app/api/chat/route.ts` - save to sidecar
13. [ ] Update `src/app/api/upload/route.ts` - upload to vault
14. [ ] Create `src/app/api/notes/save/route.ts` - save to doc endpoint

### Phase 4: UI Components (Day 2-3)
15. [ ] Rewrite `src/components/notes/NotesPanel.tsx` - sidecar sections
16. [ ] Update `src/components/chat/ChatPanel.tsx` - save buttons + commands
17. [ ] Update `src/components/library/LibraryView.tsx` - simple status
18. [ ] Update `src/app/read/[id]/page.tsx` - remove pass switcher
19. [ ] Update `src/app/settings/page.tsx` - papersPath config

### Phase 5: Cleanup (Day 3)
20. [ ] Delete `data/` folder handling code
21. [ ] Update tests if any
22. [ ] Update README with new setup instructions
23. [ ] Migration script for existing users (optional)

---

## Testing Checklist

- [ ] Scan empty folder → shows empty state
- [ ] Add PDF → creates sidecar, shows in library
- [ ] Open paper → loads PDF and sidecar
- [ ] Navigate pages → updates frontmatter current_page
- [ ] Add insight via button → appears in sidecar
- [ ] Add question via chat command → appears in sidecar
- [ ] Edit summary → saves to sidecar
- [ ] Refresh → all state persists
- [ ] Edit sidecar in Obsidian → app picks up changes
- [ ] Mark as done → updates frontmatter status

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Markdown parsing edge cases | Use established library (gray-matter for frontmatter) |
| File watching performance | Debounce, only watch papers folder |
| Concurrent edits (Obsidian + app) | Read before write, atomic writes |
| Migration breaks existing data | Keep old code path behind feature flag initially |
