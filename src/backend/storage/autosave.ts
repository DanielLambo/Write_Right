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
