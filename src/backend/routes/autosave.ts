import { Router } from 'express';
import { saveDraft, getLatestDraft, loadDraft } from '../storage/autosave';

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

// Return metadata + preview of the most recent autosaved draft
autosaveRouter.get('/latest', (req, res) => {
  try {
    const meta = getLatestDraft();
    if (!meta) return res.json({ draft: null });
    res.json({ draft: meta });
  } catch (error) {
    console.error('Error in GET /autosave/latest:', error);
    res.status(500).json({ error: 'Failed to load latest draft' });
  }
});

// Return full content of a specific draft by sessionId
autosaveRouter.get('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const content = loadDraft(sessionId);
    if (content === null) return res.status(404).json({ error: 'Draft not found' });
    res.json({ sessionId, content });
  } catch (error) {
    console.error('Error in GET /autosave/:sessionId:', error);
    res.status(500).json({ error: 'Failed to load draft' });
  }
});
