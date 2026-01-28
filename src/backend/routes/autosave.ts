import { Router } from 'express';
import { saveDraft } from '../storage/autosave';

export const autosaveRouter = Router();

interface AutosaveRequest {
  sessionId: string;
  content: string;
}

autosaveRouter.post('/', async (req, res) => {
  try {
    const { sessionId, content }: AutosaveRequest = req.body;
    if (!sessionId || content === undefined) {
      return res.status(400).json({ error: 'Missing sessionId or content' });
    }
    saveDraft(sessionId, content);
    res.json({ status: 'saved' });
  } catch (error) {
    console.error('Error in /autosave:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});
