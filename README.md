# Reader

Read papers with AI.

---

I've wanted my own reading tool for a long time. Something that connects to my vault and [Yoko](https://github.com/ThoBustos/yoko-os).

Reading papers, taking notes, remembering ideas, consolidating thoughts. None of this is intuitive. I'm a fan of the [2025 AI Engineer Reading List](https://www.latent.space/p/2025-papers) from Latent Space but getting through 50+ papers requires better tooling than what exists.

Built around the [3-pass method](https://www.youtube.com/watch?v=SKxm2HF_-k0). AI sees your full PDF. Notes go to Obsidian.

V1 came from a single prompt and a tmux/claude code session. I'll improve it as I use it and update this repo. If you see improvements, [let me know](https://github.com/ThoBustos/reader/issues).

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

MIT
