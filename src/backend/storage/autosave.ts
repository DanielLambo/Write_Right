import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DRAFTS_DIR = path.join(DATA_DIR, 'drafts');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DRAFTS_DIR)) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
}

export function saveDraft(sessionId: string, content: string): void {
  const draftFile = path.join(DRAFTS_DIR, `draft_${sessionId}.txt`);
  fs.writeFileSync(draftFile, content, 'utf8');
}

export function loadDraft(sessionId: string): string | null {
  const draftFile = path.join(DRAFTS_DIR, `draft_${sessionId}.txt`);
  if (fs.existsSync(draftFile)) {
    return fs.readFileSync(draftFile, 'utf8');
  }
  return null;
}

export interface DraftMeta {
  sessionId: string;
  wordCount: number;
  charCount: number;
  preview: string;
  modifiedAt: number;
}

export function getLatestDraft(): DraftMeta | null {
  if (!fs.existsSync(DRAFTS_DIR)) return null;
  const files = fs.readdirSync(DRAFTS_DIR).filter(f => f.startsWith('draft_') && f.endsWith('.txt'));
  if (files.length === 0) return null;

  let latest: { file: string; mtime: number } | null = null;
  for (const file of files) {
    const stat = fs.statSync(path.join(DRAFTS_DIR, file));
    if (!latest || stat.mtimeMs > latest.mtime) {
      latest = { file, mtime: stat.mtimeMs };
    }
  }
  if (!latest) return null;

  const content = fs.readFileSync(path.join(DRAFTS_DIR, latest.file), 'utf8');
  if (!content.trim()) return null;

  const sessionId = latest.file.replace(/^draft_/, '').replace(/\.txt$/, '');
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const preview = content.trim().substring(0, 140);

  return {
    sessionId,
    wordCount,
    charCount: content.length,
    preview,
    modifiedAt: latest.mtime,
  };
}
