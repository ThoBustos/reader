# Reader

Read papers with AI.

---

I've wanted my own reading tool for a long time. Something that connects to my vault and [Yoko](https://github.com/ThoBustos/yoko-os).

Reading papers, taking notes, remembering ideas, consolidating thoughts. None of this is intuitive. I'm a fan of the [2025 AI Engineer Reading List](https://www.latent.space/p/2025-papers) from Latent Space but getting through 50+ papers requires better tooling than what exists.

Built around the [3-pass method](https://www.youtube.com/watch?v=SKxm2HF_-k0). AI sees your full PDF. Notes go to Obsidian.

V1 came from a single prompt and a tmux/claude code session. I'll improve it as I use it and update this repo. If you see improvements, [let me know](https://github.com/ThoBustos/reader/issues).

---

## Features

| Feature | Status |
|---------|--------|
| PDF viewer with page navigation, zoom, text selection | ✓ |
| AI chat with Gemini (sees full PDF natively) | ✓ |
| Markdown rendering in AI responses | ✓ |
| Notes panel organized by pass | ✓ |
| Save to Obsidian vault with frontmatter | ✓ |
| Reading queue (queued, reading, completed) | ✓ |
| 3 themes (paper, classic, ink) | ✓ |
| Model selection (Gemini 3 Flash/Pro, 2.5 Flash/Pro) | ✓ |
| Keyboard-first navigation | ✓ |

---

## Setup

```bash
npm install
npm run dev
```

1. Open [localhost:3000](http://localhost:3000)
2. Settings → add [Gemini API key](https://aistudio.google.com/app/apikey)
3. Set vault path (see [yoko-os](https://github.com/ThoBustos/yoko-os) for structure)
4. Drop a PDF

---

## Configuration

### API Keys

**Gemini** (recommended): [Google AI Studio](https://aistudio.google.com/app/apikey)
- Native PDF upload, sees figures, tables, equations
- 1M+ token context handles any paper

**Claude** (optional): [Anthropic Console](https://console.anthropic.com/)
- Falls back to text extraction
- Good for selection/page-level questions

### Vault Structure

Notes save to your Obsidian vault:

```
your-vault/
└── 06_READING/
    ├── Papers/
    │   ├── paper-name.pdf      # Your PDFs
    │   └── paper-name.md       # Sidecar notes (auto-created)
    └── READING.md              # Index
```

Future: PDFs live in vault, app reads directly from folder. See [architecture](docs/ARCHITECTURE.md).

---

## Keyboard Shortcuts

### Navigation
| Key | Action |
|-----|--------|
| `j` / `k` | Next / Previous page |
| `g g` | First page |
| `G` | Last page |
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

---

## 3-Pass Method

Based on [How To Read an Academic Paper](https://www.youtube.com/watch?v=SKxm2HF_-k0):

**Pass 1** (5-10 min): Abstract, intro, conclusion, figures. Get the thesis and contribution.

**Pass 2** (30-60 min): Section beginnings and ends, key terms. Understand the core ideas.

**Pass 3** (30-60 min): Full critical read. Form your own assessment.

---

## Roadmap

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full vision.

| Feature | Status |
|---------|--------|
| Vault-first storage (Obsidian as database) | Next |
| "Save to doc" from chat | Next |
| Cross-paper context in AI | Planned |
| PDF text extraction for Claude | Planned |
| Syntax highlighting in code blocks | Planned |

---

## Tech Stack

Next.js 15, shadcn/ui, Tailwind, react-pdf-viewer, Gemini/Claude APIs.

Future: Obsidian vault as storage (no separate database).

---

## Development

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run lint     # ESLint
```

---

MIT
