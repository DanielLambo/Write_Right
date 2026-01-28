import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
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

interface SessionStats {
  sessionId: string;
  count: number;
  modes: Record<string, number>;
  avgLatencyMs: number;
  avgResponseLength: number;
  docBuckets: Record<string, number>;
}

const LOG_FILE = path.join(process.cwd(), 'data', 'interaction_logs.jsonl');

function readLogs(): LogEntry[] {
  if (!fs.existsSync(LOG_FILE)) {
    console.error('No log file found at', LOG_FILE);
    return [];
  }

  const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
  const entries: LogEntry[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as LogEntry;
      entries.push(parsed);
    } catch {
      // skip malformed lines
    }
  }

  return entries;
}

function summarizeSessions(entries: LogEntry[]): SessionStats[] {
  const bySession = new Map<string, LogEntry[]>();

  for (const entry of entries) {
    if (!bySession.has(entry.sessionId)) {
      bySession.set(entry.sessionId, []);
    }
    bySession.get(entry.sessionId)!.push(entry);
  }

  const summaries: SessionStats[] = [];

  for (const [sessionId, logs] of bySession.entries()) {
    let totalLatency = 0;
    let totalRespLength = 0;
    const modes: Record<string, number> = {};
    const buckets: Record<string, number> = {};

    logs.forEach(log => {
      totalLatency += log.latencyMs;
      totalRespLength += log.responseLength;
      modes[log.mode] = (modes[log.mode] || 0) + 1;
      buckets[log.docLengthBucket] = (buckets[log.docLengthBucket] || 0) + 1;
    });

    summaries.push({
      sessionId,
      count: logs.length,
      modes,
      avgLatencyMs: logs.length ? Math.round(totalLatency / logs.length) : 0,
      avgResponseLength: logs.length ? Math.round(totalRespLength / logs.length) : 0,
      docBuckets: buckets,
    });
  }

  return summaries;
}

function printSummary() {
  const entries = readLogs();
  if (entries.length === 0) {
    console.log('No interactions logged yet.');
    return;
  }

  const summaries = summarizeSessions(entries);
  console.log('=== Interaction Summary ===');
  summaries.forEach(s => {
    console.log(`\nSession: ${s.sessionId}`);
    console.log(`  Total interactions: ${s.count}`);
    console.log('  Mode usage:');
    Object.entries(s.modes).forEach(([mode, count]) => {
      console.log(`    ${mode}: ${count}`);
    });
    console.log(`  Avg latency: ${s.avgLatencyMs} ms`);
    console.log(`  Avg response length: ${s.avgResponseLength} chars`);
    console.log('  Document length buckets:');
    Object.entries(s.docBuckets).forEach(([bucket, count]) => {
      console.log(`    ${bucket}: ${count}`);
    });
  });
}

printSummary();

