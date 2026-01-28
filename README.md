# Write-Right

A desktop writing tool that helps students improve their essays through real-time feedback — without writing for them.

---

## What It Does

Write-Right analyzes your essay and surfaces issues in four categories:

| Category | What It Checks |
|----------|----------------|
| **Grammar** | Spelling, punctuation, capitalization |
| **Clarity** | Sentence length, passive voice, filler words, repetition |
| **Structure** | Paragraph length, transitions, intro/conclusion |
| **Argument** | Unsupported claims, absolute statements |

Each issue includes:
- What's wrong
- Why it matters  
- How to fix it
- Suggested alternatives (when applicable)

**What it won't do:** Write content for you, rewrite sentences, or use AI to generate text.

---

## Use Cases

- **Students** writing essays who want feedback before submitting
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
- Type or paste your essay in the editor
- Click **Analyze** or press **⌘↵** (Ctrl+Enter on Windows)
- Click any issue to jump to that location in your text

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
You should see JSON with a spelling correction for "tset" → "test".

**4. Run Write-Right with LanguageTool:**
```bash
LANGUAGETOOL_MODE=api LANGUAGETOOL_URL=http://localhost:8010/v2/check npm run dev
```

### Without LanguageTool

By default, Write-Right uses built-in pattern matching for common errors. This is faster but catches fewer issues.

```bash
npm run dev
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  Write-Right           150 words    [85 quality]  [Analyze]  │
├─────────────────────────────────────────────────────────┤
│                              │                          │
│   Your essay goes here.      │  Grammar  Clarity  ...   │
│   Write freely in this       │  ────────────────────    │
│   distraction-free editor.   │                          │
│                              │  ⚠ Passive voice         │
│   Click any issue on the     │  "was written"           │
│   right to jump to that      │  Try active voice...     │
│   location in your text.     │                          │
│                              │  ⚠ Long sentence         │
│                              │  45 words - consider...  │
│                              │                          │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Frontend:** Electron + React + TypeScript
- **Backend:** Node.js + Express (local server)
- **Grammar:** LanguageTool (optional) or built-in heuristics
- **Storage:** Local filesystem only

**No cloud services. No AI APIs. Everything runs locally.**

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘↵ / Ctrl+Enter | Analyze essay |

---

## Project Structure

```
src/
├── backend/
│   ├── agents/
│   │   └── writingCoach.ts    # Analysis engine
│   ├── routes/
│   │   ├── analyze.ts         # POST /analyze
│   │   └── autosave.ts        # Draft persistence
│   └── server.ts
├── renderer/
│   ├── components/
│   │   └── InsightsPanel.tsx  # Issue display
│   ├── App.tsx                # Main UI
│   └── styles.css
└── main/
    └── index.ts               # Electron entry
```

---

## Development

```bash
# Run in development mode
npm run dev

# With LanguageTool
LANGUAGETOOL_MODE=api LANGUAGETOOL_URL=http://localhost:8010/v2/check npm run dev

# Stop LanguageTool container
docker stop $(docker ps -q --filter ancestor=silviof/docker-languagetool)
```

---

## License

MIT
