import express from 'express';
import cors from 'cors';
import { assistRouter } from './routes/assist';
import { logRouter } from './routes/log';
import { autosaveRouter } from './routes/autosave';
import { analyzeRouter } from './routes/analyze';
import { simplifyRouter } from './routes/simplify';

const app = express();
const PORT = Number(process.env.BACKEND_PORT ?? 3051);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Simple in-memory rate limiter for analyze endpoint
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds
const RATE_LIMIT_MAX = 10; // max 10 requests per window

app.use('/analyze', (req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  next();
});

app.use('/assist', assistRouter);
app.use('/log', logRouter);
app.use('/autosave', autosaveRouter);
app.use('/analyze', analyzeRouter);
app.use('/simplify', simplifyRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
