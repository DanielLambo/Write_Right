# Write-Right

A desktop writing tool that helps students improve their essays through real-time feedback — without writing for them.

---

## What It Does

Write-Right analyzes your writing across four categories with **20+ individual checks**:

| Category | What It Checks |
|----------|----------------|
| **Grammar** | Spelling (150+ words), punctuation, capitalization, confused words (their/there, your/you're, its/it's, then/than), run-on sentences, sentence fragments |
| **Clarity** | Sentence length, passive voice, filler/weak words, word repetition, cliches, hedging language, sentence variety, vague openers |
| **Structure** | Paragraph length, transitions, intro/conclusion strength, repeated paragraph openers |
| **Argument** | Unsupported claims (2-sentence lookahead), absolute statements, personal opinion overuse |

Plus:
- **Readability Score** — Flesch-Kincaid reading ease and grade level
- **Quality Score** — 0-100 with both penalties and positive signals
- **8-point Checklist** — thesis, topic sentences, evidence, grammar, structure, flow, sentence variety, readability
- **Priority System** — "Fix these first" (critical) and "Then polish" (refinement)
- **29 Writing Templates** — Academic, Professional, Creative, and General

Each issue includes:
- What's wrong
- Why it matters
- How to fix it
- Suggested alternatives (when applicable)

**What it won't do:** Write content for you, rewrite sentences, or use AI to generate text.

---

## Templates

On startup, choose from 29 structural templates:

| Category | Templates |
|----------|-----------|
| **Academic** (9) | Argumentative Essay, Persuasive Essay, Compare & Contrast, Expository Essay, Research Paper, Literary Analysis, Lab Report, Book Report, Annotated Bibliography |
| **Professional** (7) | Formal Email, Cover Letter, Business Memo, Meeting Notes, Project Proposal, Executive Summary, Recommendation Letter |
| **Creative** (5) | Personal Narrative, Short Story Outline, Poetry Framework, Reflective Journal, Blog Post |
| **General** (4) | Thank You Note, Complaint Letter, Opinion Piece, Speech/Presentation |

Templates provide structure with `[placeholder prompts]` — never actual content.

---

## Who Should Use This

Write-Right exists because too many people default to AI to write for them — and never build the skill themselves. This tool is for anyone who wants to **actually get better at writing**, not outsource it.

**You should use this if you:**
- Are a student who relies on ChatGPT to write essays and wants to break that habit
- Want real feedback on your writing without having a machine rewrite it for you
- Are a teacher or professor looking for a tool to recommend to students that won't do the work for them
- Are an ESL writer who wants to understand *why* something is wrong, not just see a corrected version
- Are a developer who wants to fork this and build something better — go for it

**You should NOT use this if you:**
- Want AI to write your essays — that's the whole problem this tool is pushing back against
- Need a grammar checker that catches everything — use Grammarly for that. This is a learning tool, not a replacement
- Expect polished, production-grade software — this is an open-source project you can clone, run locally, and modify

**For educators:** Feel free to point students here. The tool never generates content. It tells students what's weak in their writing and teaches them how to fix it themselves. That's it.

**For developers:** Clone it, fork it, rip it apart, rebuild it. The MIT license means you can do whatever you want with it. If you make it better, even better.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run the app

**Fast mode** (built-in grammar heuristics, no Docker needed):
```bash
npm run dev
```

**Full mode** (LanguageTool grammar checking via Docker - one command):
```bash
npm run dev:full
```

That single command handles everything: starts the Docker container (reusing it on subsequent runs), waits for LanguageTool to be ready, then launches the app with the right env vars. First run downloads ~1GB; later runs start in ~5 seconds.

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 3. Write and analyze
- Pick a template or start with a blank page
- Type or paste your essay in the editor
- Click **Analyze** or press **Cmd+Enter** (Ctrl+Enter on Windows)
- Click any issue to jump to that location in your text

### 4. Run tests
```bash
npm test
```

---

## LanguageTool Container Management

The `dev:full` command is self-managing, but you can control the container directly:

```bash
npm run lt:start    # Start or resume the LanguageTool container
npm run lt:stop     # Stop the container (keeps its state for faster restarts)
npm run lt:logs     # Tail the container logs
```

The container is named `write-right-languagetool`, so it won't collide with other Docker work. If another container is already bound to port 8010, `lt:start` will stop it automatically and take over.

---

## How It Works

```
+-------------------------------------------------------------------+
|  Write-Right   150 words | 850 chars | 1 min | 82/100 | Standard  |
+-------------------------------------------------------------------+
|                                 |                                  |
|   [Template selector on         |  Overview  Grammar  Clarity ...  |
|    startup, or your essay       |  ----------------------------   |
|    text after choosing]         |                                  |
|                                 |  82/100 Draft Quality            |
|   Click any issue on the        |                                  |
|   right to jump to that         |  Readability: Standard           |
|   location in your text.        |  Flesch: 65  Grade: 8.2          |
|                                 |                                  |
|                                 |  Fix these first:                |
|                                 |   - Grammar errors (3)           |
|                                 |   - Unsupported claims (2)       |
|                                 |                                  |
|                                 |  Then polish:                    |
|                                 |   - Passive voice (4)            |
|                                 |   - Cliches (2)                  |
+-------------------------------------------------------------------+
```

---

## Tech Stack

- **Frontend:** Electron + React + TypeScript
- **Backend:** Node.js + Express (local server)
- **Grammar:** LanguageTool (optional) or built-in heuristics (150+ spelling, confused words, run-ons, fragments)
- **Testing:** Vitest (44 tests)
- **Storage:** Local filesystem only

**No cloud services. No AI APIs. Everything runs locally.**

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+Enter / Ctrl+Enter | Analyze essay |

---

## Project Structure

```
src/
├── backend/
│   ├── agents/
│   │   ├── writingCoach.ts        # Analysis engine (20+ checks)
│   │   ├── writingCoach.test.ts   # 44 tests
│   │   └── responseGenerator.ts   # Deterministic helpers
│   ├── routes/
│   │   ├── analyze.ts             # POST /analyze (with rate limiting)
│   │   ├── assist.ts              # POST /assist
│   │   ├── autosave.ts            # Draft persistence
│   │   ├── simplify.ts            # Sentence simplification
│   │   └── log.ts                 # Interaction logging
│   └── server.ts
├── renderer/
│   ├── components/
│   │   ├── InsightsPanel.tsx      # Issue display + readability
│   │   └── TemplateSelector.tsx   # 29 writing templates
│   ├── App.tsx                    # Main UI
│   ├── templates.ts               # Template data
│   ├── types.ts                   # TypeScript interfaces
│   └── styles.css
└── main/
    └── index.ts                   # Electron entry
```

---

## Development

```bash
npm run dev          # Fast mode (built-in grammar heuristics)
npm run dev:full     # Full mode (auto-starts LanguageTool in Docker)
npm run test         # Run the 55-test vitest suite
npm run test:watch   # Tests in watch mode
npm run lt:start     # Start/resume LanguageTool container
npm run lt:stop      # Stop LanguageTool container
npm run lt:logs      # Tail LanguageTool logs
npm run build        # Production build
```

### Troubleshooting

**Port already in use (5173 or 3051):**
```bash
kill $(lsof -ti:5173) 2>/dev/null; kill $(lsof -ti:3051) 2>/dev/null
npm run dev
```

**LanguageTool didn't start in time:**
```bash
npm run lt:logs      # See what LanguageTool is doing
npm run lt:stop && npm run lt:start
```

---

## License

MIT
