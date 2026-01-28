import { Router } from 'express';
import { appendLog } from '../storage/logger';

export const logRouter = Router();

interface LogRequest {
  sessionId: string;
  action: string;
  selection: string;
  selectionType: 'TERM' | 'SNIPPET';
  docLength: number;
  wordCount: number;
  latencyMs: number;
  responseLength: number;
  mode: 'explain' | 'examples' | 'outline';
  docLengthBucket: string;
}

logRouter.post('/', async (req, res) => {
  try {
    const logData: LogRequest = req.body;
    appendLog(logData);
    res.json({ status: 'logged' });
  } catch (error) {
    console.error('Error in /log:', error);
    res.status(500).json({ error: 'Failed to log interaction' });
  }
});
