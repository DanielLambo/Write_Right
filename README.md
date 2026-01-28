## Problem

Students writing essays constantly bounce between their draft, search engines, PDFs, and notes just to understand concepts or find examples. This context switching breaks focus, hurts comprehension, and makes writing slower and more frustrating.

The Learning‑While‑Writing Assistant is a desktop app that embeds a lightweight “agent” directly into the writing experience so students can learn while they type instead of after they submit.

## Why existing tools fall short

- **Generic writing assistants** focus on grammar and style, not understanding.  
- **Search engines and PDFs** force students out of the writing flow.  
- **Course platforms** provide resources, but not inline, context‑aware support tied to the exact sentence being written.

This project keeps the student in one window while still giving explanations, examples, and structure help grounded in their own essay.

## Architecture (high level)

```text
┌────────────────────────┐      ┌────────────────────────────┐
│  Electron Desktop App  │      │    Local Node.js Server    │
│  (React + TypeScript)  │◀────▶│  (Express + TS, offline)   │
└──────────┬─────────────┘      └───────────┬────────────────┘
           │                                │
           │ /assist, /log, /autosave       │
           ▼                                ▼
   Essay editor + assistant        Deterministic agent pipeline
   - textarea + word count         - context extraction
   - selection tracking            - intent / role detection
   - Explain / Examples / Outline  - response assembly + logging
```

## Agent design

The backend implements a deterministic, explainable agent pipeline:

- **Context extraction**: For each request, the agent pulls a window around the selection based on `selectionStart`/`selectionEnd` and the full essay text.  
- **Intent & role detection** (heuristics only):
  - Classifies the selection as **TERM** (≤5 words, no period) or **SNIPPET** (sentence‑like).
  - Detects **writing tone** (argumentative vs explanatory vs mixed) from markers like “therefore”, “because”, “for example”.
  - Detects **content role** (claim, definition, example, other) using simple phrase and pattern checks.
- **Lightweight semantic grounding**:
  - Extracts “key terms” from the essay via frequency + position weighting (no ML libs, just string ops).
  - Uses these terms to bias outlines and examples so responses stay tied to the student’s actual topic.
- **Response assembly**:
  - **Explain**: Paraphrases the selection in simpler language, explains how it functions in the paragraph, and suggests a concrete editing move.
  - **Examples**: Generates one academic‑style and one real‑world‑style example anchored on detected key terms.
  - **Outline**: Proposes a 4–6 item structure using paragraph boundaries and key terms (intro, body paragraphs, conclusion).
- **Explainability metadata**:
  - Every `/assist` response includes `reasoningNotes` describing why the agent classified the selection as TERM vs SNIPPET and why it chose that response structure.
  - The UI exposes this behind a small “Why this answer?” toggle so the behavior is transparent.

All of this logic is deterministic and offline; swapping in an LLM later only requires routing through `generateWithProvider`.

## Logging & analysis

Every interaction is logged to `data/interaction_logs.jsonl` with:

- `sessionId`, `mode`, `selection`, `selectionType`  
- `docLength`, `wordCount`, `docLengthBucket` (`<500`, `500-1500`, `>1500`)  
- `latencyMs` (end‑to‑end assist time)  
- `responseLength` (characters)

A small script `scripts/printSessionSummary.ts` reads the log file and prints per‑session summaries (interaction counts, mode usage, average latency, etc.) to support offline analysis and iteration.

## Tradeoffs & limitations

- The agent uses simple heuristics, not a full ML model, so classifications are approximate by design.  
- Semantic grounding is based on word statistics, not embeddings, to keep the stack light and offline.  
- The editor is a textarea (no rich text) to keep focus on the learning workflow rather than formatting.

These choices keep the project shippable in hours while still making the “agent” feel intentional, inspectable, and upgradeable.

## What we’d add with more time

- Plug in an LLM provider behind `generateWithProvider` for richer explanations and examples.  
- Smarter document‑level reasoning (thesis detection, argument coherence checks).  
- Per‑student analytics and progress insights built on top of the existing JSONL logs.  
- Better editor UX (Markdown, comments, inline annotations).

## How to run

```bash
npm install
npm run dev   # backend + renderer + Electron
```

For a quick analytics summary of interactions:

```bash
npm run summary
```
