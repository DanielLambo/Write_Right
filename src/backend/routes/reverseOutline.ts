import { Router } from 'express';

export const reverseOutlineRouter = Router();

interface ReverseOutlineParagraph {
  index: number;
  firstSentence: string;
  lastSentence: string;
  sentenceCount: number;
  isRisk: boolean;
}

function getSentencesFromText(text: string): string[] {
  return text.match(/[^.!?]*[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 0) || [];
}

reverseOutlineRouter.post('/', (req, res) => {
  try {
    const { essayText } = req.body;

    if (!essayText || typeof essayText !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid essayText' });
    }

    const paragraphs = essayText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const result: ReverseOutlineParagraph[] = paragraphs.map((para, i) => {
      const sentences = getSentencesFromText(para);
      const sentenceCount = sentences.length;
      const firstSentence = sentences[0] || para.substring(0, 80);
      const lastSentence = sentenceCount > 1 ? sentences[sentenceCount - 1] : firstSentence;

      return {
        index: i + 1,
        firstSentence,
        lastSentence,
        sentenceCount,
        isRisk: sentenceCount <= 1,
      };
    });

    res.json({ paragraphs: result, totalParagraphs: result.length });
  } catch (error) {
    console.error('Error in /reverse-outline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
