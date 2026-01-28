import { Router } from 'express';
import { simplifySentence } from '../agents/writingCoach';

export const simplifyRouter = Router();

interface SimplifyRequest {
  text: string;
}

simplifyRouter.post('/', (req, res) => {
  try {
    const { text }: SimplifyRequest = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid text' });
    }

    const result = simplifySentence(text);
    res.json(result);
  } catch (error) {
    console.error('Error in /simplify:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
