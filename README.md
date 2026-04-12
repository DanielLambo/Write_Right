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

## Use Cases

- **Students** writing essays who want feedback before submitting
- **Professionals** drafting emails, memos, and proposals
- **Self-editing** to catch common writing issues
- **Learning** what makes writing clear and effective
- **ESL writers** improving grammar and style

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run the app
```bash
npm run dev
```

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

## Enhanced Grammar with LanguageTool (Optional)

For more accurate grammar checking, you can run LanguageTool locally via Docker.

### Setup

**1. Install Docker Desktop** (if you don't have it):
https://www.docker.com/products/docker-desktop/

**2. Start LanguageTool server:**
```bash
docker run -d -p 8010:8010 silviof/docker-languagetool
```
This downloads ~1GB on first run and takes ~15 seconds to start.

**3. Verify it's running:**
```bash
curl http://localhost:8010/v2/check -d "language=en-US&text=This is a tset."
```
You should see JSON with a spelling correction for "tset" -> "test".

**4. Run Write-Right with LanguageTool:**
```bash
LANGUAGETOOL_MODE=api LANGUAGETOOL_URL=http://localhost:8010/v2/check npm run dev
```

### Without LanguageTool

By default, Write-Right uses built-in heuristics for grammar. This is faster and requires no setup.

```bash
npm run dev
```

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
# Run in development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# With LanguageTool
LANGUAGETOOL_MODE=api LANGUAGETOOL_URL=http://localhost:8010/v2/check npm run dev

# Stop LanguageTool container
docker stop $(docker ps -q --filter ancestor=silviof/docker-languagetool)
```

### Troubleshooting

**Port already in use:**
```bash
kill $(lsof -ti:5173) 2>/dev/null; kill $(lsof -ti:3051) 2>/dev/null
npm run dev
```

---

## License

MIT
