# Reader - Paper Reading Tool

A minimalist paper reading tool with AI assistance and Obsidian vault integration.

## Features

- **PDF Viewer**: Clean interface with page navigation, zoom, and text selection
- **AI Chat**: Ask questions about papers using Gemini (sees full PDF) or Claude
- **Structured Notes**: Take notes organized by the 3-pass reading method
- **Vault Integration**: Save notes to Obsidian with proper frontmatter
- **Reading Queue**: Track papers by status (queued, reading, completed)
- **3 Themes**: Paper (minimal), Classic (light), Ink (dark)
- **Keyboard-First**: Linear-style shortcuts for everything

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and:

1. Go to Settings (gear icon)
2. Add your Gemini API key (recommended) or Claude API key
3. Set your Obsidian vault path
4. Add a PDF to start reading!

## Configuration

### API Keys

- **Gemini** (recommended): Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
  - Uses native PDF upload - sees figures, tables, equations
  - 1M+ token context handles any paper

- **Claude**: Get from [Anthropic Console](https://console.anthropic.com/)
  - Falls back to text extraction
  - Good for selection/page-level questions

### Vault Setup

Set your Obsidian vault path in Settings. Notes are saved to:

```
your-vault/
└── 06_READING/
    ├── _GUIDE.md
    ├── READING.md      # Backlog/queue
    ├── Papers/         # Individual paper notes
    ├── Daily/          # Reading logs
    ├── Highlights/     # Key quotes
    └── Synthesis/      # Cross-paper analysis
```

## Keyboard Shortcuts

### Navigation
| Key | Action |
|-----|--------|
| `j` / `k` | Next / Previous page |
| `g g` | Go to first page |
| `G` | Go to last page |
| `h` / `l` | Collapse / Expand sidebar |

### Commands
| Key | Action |
|-----|--------|
| `⌘ K` | Command palette |
| `⌘ J` | Focus chat |
| `⌘ Enter` | Send message |
| `c` | Toggle context mode |

### Reading
| Key | Action |
|-----|--------|
| `1` / `2` / `3` | Switch pass |
| `m` | Mark complete |
| `n` | New note |

## 3-Pass Reading Method

Based on [How To Read an Academic Paper](https://www.youtube.com/watch?v=SKxm2HF_-k0):

1. **Pass 1 (5-10 min)**: Abstract, intro, conclusion, figures → Thesis & contribution
2. **Pass 2 (30-60 min)**: Section beginnings/ends, key terms → Deep understanding
3. **Pass 3 (30-60 min)**: Full critical read → Your own assessment

## Tech Stack

- Next.js 15 (App Router)
- shadcn/ui + Tailwind CSS
- react-pdf-viewer for PDF rendering
- Gemini 2 Flash / Claude API for AI
- Local JSON storage

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## License

MIT
