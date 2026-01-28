# Write-Right

A serious essay-writing environment that surfaces revision insights without writing for you.

---

## Philosophy

Write-Right is built on a simple principle: **great writing comes from thoughtful revision, not automation.**

This tool analyzes your draft and surfaces signals about clarity, structure, flow, and argument strength. It helps you see your writing more clearly — but every word remains yours.

> *Designed to improve your writing — not replace it.*

---

## What It Does

**Draft Analysis** scans your essay and surfaces:

- **Mechanics** — Spelling, punctuation, capitalization
- **Clarity** — Sentence length, passive constructions, filler words, repetition
- **Flow** — Paragraph structure, transitions, intro/conclusion strength
- **Argument** — Unsupported claims, questionable absolutes

Each signal includes:
- A severity level (critical, needs review, optional refinement)
- An explanation of the pattern detected
- Revision guidance on how to address it
- Optional micro-suggestions (short phrases only)

**What it won't do:**
- Write paragraphs or sentences for you
- Rewrite your text
- Use external AI/LLM services
- Replace your judgment as a writer

---

## How to Run

```bash
npm install
npm run dev
```

Press **⌘↵** (or **Ctrl+Enter**) to analyze your draft.

---

## Interface

```
┌─────────────────────────────────────────────────────────────┐
│ Write-Right          450 words  |  2 min  |  78 quality    │
├─────────────────────────────────────────────────────────────┤
│                              │                              │
│    DRAFT (Hero)              │    REVISION INSIGHTS         │
│                              │    ─────────────────         │
│    Your essay lives          │    [Mechanics] [Clarity]     │
│    here. Distraction-        │    [Flow] [Argument]         │
│    free, serif type,         │    [Checklist]               │
│    generous spacing.         │                              │
│                              │    Signals appear here       │
│                              │    with guidance on how      │
│                              │    to revise.                │
│                              │                              │
├─────────────────────────────────────────────────────────────┤
│          Designed to improve your writing — not replace it. │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
src/
├── backend/
│   ├── agents/
│   │   └── writingCoach.ts    # Deterministic analysis engine
│   ├── routes/
│   │   ├── analyze.ts         # POST /analyze
│   │   ├── autosave.ts        # Draft persistence
│   │   └── log.ts             # Interaction logging
│   └── server.ts
├── renderer/
│   ├── components/
│   │   ├── InsightsPanel.tsx  # Revision signals panel
│   │   └── Editor.tsx         # Draft editor (hero)
│   ├── App.tsx
│   ├── types.ts
│   └── styles.css
└── main/
    └── index.ts               # Electron main process
```

---

## Design Decisions

### Guardrails Against Content Generation

The analysis engine enforces strict limits:
- No suggestion exceeds 15 words
- No multi-sentence outputs
- No paragraph rewrites
- Truncation enforced in code (`truncateSuggestion()`)

### Terminology

We deliberately avoid:
- "AI", "assistant", "coach", "generate", "rewrite"

We use:
- "Draft Analysis", "Revision Insights", "Signals", "Guidance"

This reinforces that the tool supports human authorship, not automation.

### Visual Hierarchy

- **Editor is the hero** — large, serif type, generous margins
- **Insights panel is supportive** — smaller, utility styling, subtle background
- **Footer badge** — constant reminder of the tool's integrity

---

## Tech Stack

- **Frontend**: Electron + React + TypeScript
- **Backend**: Node.js + Express (local server)
- **Storage**: Local filesystem (JSONL logs, text drafts)
- **External APIs**: None. 100% offline, deterministic.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘↵ / Ctrl+Enter | Analyze draft |

---

## What Changed (v2 Refinement)

### Product Identity
- Renamed panel from "Writing Coach" → "Revision Insights"
- Replaced "Analyze" → "Analyze Draft"
- Changed "issues" → "signals"
- Updated all copy to emphasize craftsmanship and revision

### UI Polish
- Editor now uses serif typography with generous line height
- Clearer visual hierarchy: editor as hero, insights as supportive
- Refined color system for severity (critical/warning/info)
- Added "Last analyzed X ago" indicator
- Added integrity badge in footer
- Improved spacing, typography scale, and hover states

### Interaction Model
- Removed any language suggesting content generation
- Signals described as patterns to notice, not corrections to accept
- "Revision guidance" instead of "How to fix"

---

## License

MIT
