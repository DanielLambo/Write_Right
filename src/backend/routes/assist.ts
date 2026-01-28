import { Router } from 'express';
import { generateResponse } from '../agents/responseGenerator';

export const assistRouter = Router();

interface AssistRequest {
  mode: 'explain' | 'examples' | 'outline';
  selection: string;
  essayText: string;
  selectionStart: number;
  selectionEnd: number;
}

assistRouter.post('/', async (req, res) => {
  try {
    const { mode, selection, essayText, selectionStart, selectionEnd }: AssistRequest = req.body;

    if (!mode || !selection || !essayText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = generateResponse(mode, selection, essayText, selectionStart, selectionEnd);

    res.json(response);
  } catch (error) {
    console.error('Error in /assist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
