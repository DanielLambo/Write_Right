import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(DATA_DIR, 'interaction_logs.jsonl');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface LogEntry {
  sessionId: string;
  action: string;
  selection: string;
  selectionType: 'TERM' | 'SNIPPET';
  timestamp: string;
  docLength: number;
  wordCount: number;
  latencyMs: number;
  responseLength: number;
  mode: 'explain' | 'examples' | 'outline';
  docLengthBucket: string;
}

export function appendLog(logData: Omit<LogEntry, 'timestamp'>): void {
  const entry: LogEntry = {
    ...logData,
    timestamp: new Date().toISOString()
  };
  
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(LOG_FILE, line, 'utf8');
}
