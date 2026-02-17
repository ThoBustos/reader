# Reader Architecture

## Core Principle

**Obsidian is the database.** No separate JSON storage. The vault is the source of truth.

---

## Folder Structure

```
vault/06_READING/
├── Papers/
│   ├── attention-is-all-you-need.pdf    # PDF file
│   └── attention-is-all-you-need.md     # Sidecar note (auto-created)
├── Queue/                                # Optional: papers to read
└── READING.md                           # Auto-generated index
```

---

## Sidecar Note Format

Each PDF has a companion `.md` file with the same name. App creates it automatically if missing.

```markdown
---
title: "Attention Is All You Need"
authors: ["Vaswani", "Shazeer"]
status: reading    # reading | done
current_page: 5
date_added: 2026-02-16
date_completed:
tags: [transformers, attention]
---

# Attention Is All You Need

## Summary
[Your 1-2 sentence summary]

## Insights
- Attention replaces RNNs entirely
- Multi-head attention enables different representation subspaces

## Questions
- [ ] Why positional encoding?
- [x] Self vs cross attention → self attends to same sequence

## Highlights
> "We propose a new simple network architecture..." (p. 1)

## Notes
[Free-form notes]

## Chat
[Saved AI exchanges]
```

---

## "Save to Doc" from Chat

The chat is both Q&A and a command interface for the note.

### Natural Language Commands

| You say | What happens |
|---------|--------------|
| "save that insight" | AI's last response → ## Insights |
| "add question: why does X work?" | Adds to ## Questions |
| "highlight that quote" | Selected text + page → ## Highlights |
| "save to notes" | AI response → ## Notes |
| "summarize this" + "save as summary" | Response → ## Summary |

### Button Actions

Each AI response has quick actions:
- **+ Insight** → appends to ## Insights
- **+ Question** → adds to ## Questions
- **+ Note** → appends to ## Notes

One click. Saves immediately to sidecar.

### How It Works

1. User asks AI a question
2. AI responds with markdown
3. User says "save that insight" or clicks button
4. App parses the sidecar markdown
5. Appends response under the right heading
6. Writes back to file
7. Obsidian sees the change immediately

---

## Cross-Paper Context

Since the app reads from the vault, AI can reference your other reading.

### What AI Knows

When you ask a question:
- Current paper's full PDF
- Current paper's sidecar (your notes, insights, questions)
- Related papers' sidecars (by shared tags)
- Your vault's related notes (configurable)

### Example Prompts

"How does this compare to the transformer paper I read last week?"
→ AI checks your notes on papers tagged #transformers

"What questions do I still have open across my reading?"
→ AI scans ## Questions sections for unchecked items

"Connect this to what I learned about attention"
→ AI references your ## Insights from related papers

---

## Status Flow

Simple two states:

```
reading → done
```

No pass tracking in UI. The method (Pass 1/2/3) is guidance in the docs, not enforced state.

Progress shows as:
- Page progress bar
- `status: reading` vs `status: done` in frontmatter

---

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vault     │────▶│    App      │────▶│   Vault     │
│  (PDFs +    │     │  (Reader)   │     │  (Updated   │
│  sidecars)  │     │             │     │  sidecars)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       │            │     AI      │            │
       │            │  (Gemini)   │            │
       │            └─────────────┘            │
       │                   │                   │
       └───────────────────┴───────────────────┘
                    Obsidian sees
                    all changes
```

---

## Implementation Phases

### Phase 1: Vault-First Storage
- [ ] Config: `papers_path` points to vault folder
- [ ] Scan folder for PDFs on startup
- [ ] Auto-create sidecar if missing
- [ ] Read/write frontmatter directly
- [ ] Remove JSON storage

### Phase 2: Unified Notes UX
- [ ] Right panel shows sidecar markdown
- [ ] Real-time editing with auto-save
- [ ] Sections: Summary, Insights, Questions, Highlights, Notes

### Phase 3: Chat → Notes Integration
- [ ] "Save to..." buttons on AI responses
- [ ] Natural language commands ("save that insight")
- [ ] Parse and update sidecar sections

### Phase 4: Cross-Paper Context
- [ ] Index all sidecars on startup
- [ ] Include related notes in AI prompts
- [ ] "What have I learned about X?" queries
