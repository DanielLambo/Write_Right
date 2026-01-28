import { Router } from 'express';
import { analyzeEssayAsync, analyzeSelection } from '../agents/writingCoach';

export const analyzeRouter = Router();

interface AnalyzeRequest {
  essayText: string;
  selectionStart?: number;
  selectionEnd?: number;
}

analyzeRouter.post('/', async (req, res) => {
  try {
    const { essayText, selectionStart, selectionEnd }: AnalyzeRequest = req.body;

    if (essayText === undefined) {
      return res.status(400).json({ error: 'Missing essayText' });
    }

    // If selection provided, return targeted analysis (sync, heuristics only)
    if (selectionStart !== undefined && selectionEnd !== undefined) {
      const issues = analyzeSelection(essayText, selectionStart, selectionEnd);
      return res.json({ issues });
    }

    // Full analysis (async, supports LanguageTool if configured)
    const result = await analyzeEssayAsync(essayText);
    res.json(result);
  } catch (error) {
    console.error('Error in /analyze:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
