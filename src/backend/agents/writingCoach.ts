/**
 * Write-Right: Deterministic Writing Coach Engine
 * 
 * Analyzes essays for:
 * - Grammar & Mechanics
 * - Clarity & Style
 * - Structure & Coherence
 * - Argument & Evidence
 * 
 * GUARDRAIL: This engine NEVER generates content.
 * It only identifies issues and provides guidance.
 * Any suggestion must be <= 1 sentence or a short phrase.
 * 
 * Optional: LanguageTool integration for enhanced grammar checking.
 * Set LANGUAGETOOL_MODE=api and LANGUAGETOOL_URL to enable.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const LANGUAGETOOL_MODE = process.env.LANGUAGETOOL_MODE || 'heuristic';
const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || 'http://localhost:8010/v2/check';

// ============================================================================
// TYPES
// ============================================================================

export type IssueSeverity = 'error' | 'warning' | 'suggestion';
export type IssueCategory = 'grammar' | 'clarity' | 'structure' | 'argument';
export type CheckStatus = 'pass' | 'warning' | 'fail';

export interface WritingIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  howToFix: string;
  /** Optional micro-suggestion (MUST be <= 15 words) */
  microSuggestion?: string;
  /** Character position in the essay */
  startIndex: number;
  endIndex: number;
  /** The problematic text */
  excerpt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface PriorityItem {
  label: string;
  count?: number;
  category: IssueCategory | 'structure';
}

export interface AnalysisResult {
  /** 0-100 score */
  qualityScore: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  issues: WritingIssue[];
  checklist: ChecklistItem[];
  /** Fix these first - critical issues */
  fixFirst: PriorityItem[];
  /** Then polish - secondary issues */
  thenPolish: PriorityItem[];
  /** Summary stats per category */
  categoryCounts: Record<IssueCategory, number>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_SUGGESTION_WORDS = 15;

const COMMON_MISSPELLINGS: Record<string, string> = {
  'teh': 'the',
  'adn': 'and',
  'recieve': 'receive',
  'seperate': 'separate',
  'occured': 'occurred',
  'definately': 'definitely',
  'accomodate': 'accommodate',
  'occurence': 'occurrence',
  'independant': 'independent',
  'neccessary': 'necessary',
  'untill': 'until',
  'wierd': 'weird',
  'thier': 'their',
  'freind': 'friend',
  'goverment': 'government',
  'enviroment': 'environment',
  'begining': 'beginning',
  'beleive': 'believe',
  'acheive': 'achieve',
  'arguement': 'argument',
};

const WEAK_WORDS = ['very', 'really', 'just', 'basically', 'actually', 'literally', 'things', 'stuff'];

const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|been|being)\s+(\w+ed)\b/gi,
  /\b(is|are|was|were|been|being)\s+(\w+en)\b/gi,
];

const TRANSITION_WORDS = [
  'however', 'therefore', 'furthermore', 'moreover', 'consequently',
  'nevertheless', 'although', 'whereas', 'meanwhile', 'subsequently',
  'in contrast', 'on the other hand', 'as a result', 'for example',
  'in addition', 'similarly', 'in conclusion', 'to summarize',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
}

function calculateReadingTime(wordCount: number): number {
  // Average reading speed: 200 words per minute
  return Math.max(1, Math.ceil(wordCount / 200));
}

function truncateSuggestion(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= MAX_SUGGESTION_WORDS) return text;
  return words.slice(0, MAX_SUGGESTION_WORDS).join(' ') + '...';
}

function getSentences(text: string): Array<{ text: string; start: number; end: number }> {
  const sentences: Array<{ text: string; start: number; end: number }> = [];
  const regex = /[^.!?]*[.!?]+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    sentences.push({
      text: match[0].trim(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return sentences;
}

function getParagraphs(text: string): Array<{ text: string; start: number; end: number }> {
  const paragraphs: Array<{ text: string; start: number; end: number }> = [];
  const parts = text.split(/(\n\s*\n)/);
  let currentIndex = 0;
  for (const part of parts) {
    if (part.trim().length > 0 && !/^\s*$/.test(part)) {
      paragraphs.push({
        text: part.trim(),
        start: currentIndex,
        end: currentIndex + part.length,
      });
    }
    currentIndex += part.length;
  }
  return paragraphs;
}

// ============================================================================
// GRAMMAR & MECHANICS CHECKS
// ============================================================================

function checkSpelling(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  
  for (const word of words) {
    if (COMMON_MISSPELLINGS[word]) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          id: generateId(),
          category: 'grammar',
          severity: 'error',
          title: 'Possible spelling error',
          description: `"${match[0]}" may be misspelled.`,
          howToFix: `Check if you meant "${COMMON_MISSPELLINGS[word]}".`,
          microSuggestion: COMMON_MISSPELLINGS[word],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          excerpt: match[0],
        });
      }
    }
  }
  return issues;
}

function checkPunctuation(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  
  // Double spaces
  const doubleSpaceRegex = /  +/g;
  let match;
  while ((match = doubleSpaceRegex.exec(text)) !== null) {
    issues.push({
      id: generateId(),
      category: 'grammar',
      severity: 'warning',
      title: 'Extra spaces',
      description: 'Multiple consecutive spaces found.',
      howToFix: 'Use a single space between words.',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      excerpt: '[multiple spaces]',
    });
  }

  // Missing space after punctuation
  const missingSpaceRegex = /[.!?,;:][A-Za-z]/g;
  while ((match = missingSpaceRegex.exec(text)) !== null) {
    issues.push({
      id: generateId(),
      category: 'grammar',
      severity: 'warning',
      title: 'Missing space after punctuation',
      description: 'Add a space after punctuation marks.',
      howToFix: 'Insert a space after the punctuation mark.',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      excerpt: match[0],
    });
  }

  // Sentences not starting with capital letter (excluding first character)
  const sentences = getSentences(text);
  for (const sentence of sentences) {
    const trimmed = sentence.text.trim();
    if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
      issues.push({
        id: generateId(),
        category: 'grammar',
        severity: 'error',
        title: 'Capitalize first word',
        description: 'Sentences should start with a capital letter.',
        howToFix: 'Capitalize the first letter of this sentence.',
        microSuggestion: trimmed.charAt(0).toUpperCase() + trimmed.slice(1, 20),
        startIndex: sentence.start,
        endIndex: Math.min(sentence.start + 20, sentence.end),
        excerpt: trimmed.substring(0, 30),
      });
    }
  }

  return issues;
}

// ============================================================================
// CLARITY & STYLE CHECKS
// ============================================================================

function checkSentenceLength(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  for (const sentence of sentences) {
    const wordCount = countWords(sentence.text);
    
    if (wordCount > 40) {
      issues.push({
        id: generateId(),
        category: 'clarity',
        severity: 'warning',
        title: 'Very long sentence',
        description: `This sentence has ${wordCount} words. Long sentences can be hard to follow.`,
        howToFix: 'Consider splitting into two sentences. Look for a natural break point (and, but, because).',
        startIndex: sentence.start,
        endIndex: sentence.end,
        excerpt: sentence.text.substring(0, 50) + '...',
      });
    } else if (wordCount > 30) {
      issues.push({
        id: generateId(),
        category: 'clarity',
        severity: 'suggestion',
        title: 'Long sentence',
        description: `This sentence has ${wordCount} words. Consider if it could be clearer.`,
        howToFix: 'Read it aloud. If you run out of breath, consider splitting it.',
        startIndex: sentence.start,
        endIndex: sentence.end,
        excerpt: sentence.text.substring(0, 50) + '...',
      });
    }
  }

  return issues;
}

function checkPassiveVoice(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];

  for (const pattern of PASSIVE_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        id: generateId(),
        category: 'clarity',
        severity: 'suggestion',
        title: 'Passive voice detected',
        description: 'Passive voice can make writing less direct. Active voice is often clearer.',
        howToFix: 'Rewrite to show who/what performs the action. Ask: "Who did this?"',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        excerpt: match[0],
      });
    }
  }

  return issues;
}

function checkWeakWords(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];

  for (const word of WEAK_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        id: generateId(),
        category: 'clarity',
        severity: 'suggestion',
        title: 'Weak or filler word',
        description: `"${match[0]}" often weakens writing. Consider removing it or using a stronger word.`,
        howToFix: 'Try removing this word entirely. Does the sentence still work?',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        excerpt: match[0],
      });
    }
  }

  return issues;
}

function checkWordRepetition(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  for (let i = 0; i < sentences.length - 1; i++) {
    const current = sentences[i].text.toLowerCase();
    const next = sentences[i + 1].text.toLowerCase();
    
    const currentWords = current.match(/\b[a-z]{5,}\b/g) || [];
    const nextWords = next.match(/\b[a-z]{5,}\b/g) || [];
    
    for (const word of currentWords) {
      if (nextWords.includes(word) && !['which', 'their', 'there', 'where', 'these', 'those', 'about'].includes(word)) {
        issues.push({
          id: generateId(),
          category: 'clarity',
          severity: 'suggestion',
          title: 'Word repetition',
          description: `"${word}" appears in consecutive sentences.`,
          howToFix: 'Consider using a synonym or restructuring to avoid repetition.',
          startIndex: sentences[i + 1].start,
          endIndex: sentences[i + 1].end,
          excerpt: `...${word}...`,
        });
        break; // One issue per sentence pair
      }
    }
  }

  return issues;
}

// ============================================================================
// STRUCTURE & COHERENCE CHECKS
// ============================================================================

function checkParagraphLength(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const paragraphs = getParagraphs(text);

  for (const para of paragraphs) {
    const sentenceCount = countSentences(para.text);
    const wordCount = countWords(para.text);

    if (sentenceCount > 8) {
      issues.push({
        id: generateId(),
        category: 'structure',
        severity: 'warning',
        title: 'Very long paragraph',
        description: `This paragraph has ${sentenceCount} sentences. Consider breaking it up.`,
        howToFix: 'Find a natural topic shift and start a new paragraph there.',
        startIndex: para.start,
        endIndex: para.end,
        excerpt: para.text.substring(0, 40) + '...',
      });
    }

    if (sentenceCount === 1 && wordCount < 30) {
      issues.push({
        id: generateId(),
        category: 'structure',
        severity: 'suggestion',
        title: 'Short paragraph',
        description: 'Single-sentence paragraphs can feel abrupt in academic writing.',
        howToFix: 'Consider combining with an adjacent paragraph or expanding with supporting details.',
        startIndex: para.start,
        endIndex: para.end,
        excerpt: para.text.substring(0, 40) + '...',
      });
    }
  }

  return issues;
}

function checkTransitions(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const paragraphs = getParagraphs(text);

  if (paragraphs.length < 3) return issues;

  // Check if body paragraphs start with transitions
  for (let i = 1; i < paragraphs.length; i++) {
    const paraStart = paragraphs[i].text.toLowerCase().substring(0, 50);
    const hasTransition = TRANSITION_WORDS.some(t => paraStart.includes(t.toLowerCase()));

    if (!hasTransition && i < paragraphs.length - 1) {
      issues.push({
        id: generateId(),
        category: 'structure',
        severity: 'suggestion',
        title: 'Consider adding a transition',
        description: 'This paragraph could benefit from a transition word or phrase.',
        howToFix: 'Start with a transition like "However," "Furthermore," "In contrast," or "Additionally."',
        microSuggestion: 'Furthermore, Moreover, However, In addition,',
        startIndex: paragraphs[i].start,
        endIndex: Math.min(paragraphs[i].start + 30, paragraphs[i].end),
        excerpt: paragraphs[i].text.substring(0, 30) + '...',
      });
    }
  }

  return issues;
}

function checkIntroConclusion(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const paragraphs = getParagraphs(text);
  const wordCount = countWords(text);

  if (paragraphs.length < 3 || wordCount < 200) return issues;

  // Check introduction
  const intro = paragraphs[0].text.toLowerCase();
  const hasThesisIndicator = ['argue', 'claim', 'believe', 'will discuss', 'this essay', 'this paper', 'thesis'].some(
    t => intro.includes(t)
  );
  
  if (!hasThesisIndicator) {
    issues.push({
      id: generateId(),
      category: 'structure',
      severity: 'suggestion',
      title: 'Introduction could be stronger',
      description: 'Your introduction might benefit from a clearer thesis statement.',
      howToFix: 'End your intro with a sentence that states your main argument or purpose.',
      startIndex: paragraphs[0].start,
      endIndex: paragraphs[0].end,
      excerpt: paragraphs[0].text.substring(0, 40) + '...',
    });
  }

  // Check conclusion
  const conclusion = paragraphs[paragraphs.length - 1].text.toLowerCase();
  const hasConclusionIndicator = ['in conclusion', 'to summarize', 'in summary', 'therefore', 'thus', 'overall'].some(
    t => conclusion.includes(t)
  );

  if (!hasConclusionIndicator && paragraphs.length >= 4) {
    issues.push({
      id: generateId(),
      category: 'structure',
      severity: 'suggestion',
      title: 'Conclusion could be stronger',
      description: 'Your conclusion might benefit from a signal phrase.',
      howToFix: 'Start with "In conclusion," "To summarize," or "Overall" to signal you\'re wrapping up.',
      microSuggestion: 'In conclusion, To summarize,',
      startIndex: paragraphs[paragraphs.length - 1].start,
      endIndex: paragraphs[paragraphs.length - 1].end,
      excerpt: paragraphs[paragraphs.length - 1].text.substring(0, 40) + '...',
    });
  }

  return issues;
}

// ============================================================================
// ARGUMENT & EVIDENCE CHECKS
// ============================================================================

function checkUnsupportedClaims(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  const claimIndicators = ['should', 'must', 'always', 'never', 'all', 'none', 'best', 'worst', 'clearly', 'obviously'];
  const evidenceIndicators = ['because', 'since', 'for example', 'for instance', 'according to', 'research shows', 'studies', 'evidence'];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].text.toLowerCase();
    const hasClaim = claimIndicators.some(c => sentence.includes(c));
    
    if (hasClaim) {
      // Check if this sentence or the next has evidence
      const hasEvidence = evidenceIndicators.some(e => sentence.includes(e));
      const nextHasEvidence = sentences[i + 1] && evidenceIndicators.some(e => sentences[i + 1].text.toLowerCase().includes(e));

      if (!hasEvidence && !nextHasEvidence) {
        issues.push({
          id: generateId(),
          category: 'argument',
          severity: 'warning',
          title: 'Claim may need support',
          description: 'This sentence makes a strong claim. Consider adding evidence or reasoning.',
          howToFix: 'Follow this claim with "because...", an example, or a citation.',
          startIndex: sentences[i].start,
          endIndex: sentences[i].end,
          excerpt: sentences[i].text.substring(0, 50) + '...',
        });
      }
    }
  }

  return issues;
}

function checkQuestionableStatements(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  const absolutes = ['everyone knows', 'it is obvious', 'clearly', 'undoubtedly', 'without question', 'no one can deny'];

  for (const sentence of sentences) {
    const lower = sentence.text.toLowerCase();
    for (const phrase of absolutes) {
      if (lower.includes(phrase)) {
        issues.push({
          id: generateId(),
          category: 'argument',
          severity: 'warning',
          title: 'Questionable absolute statement',
          description: `"${phrase}" assumes agreement that may not exist. This can weaken your argument.`,
          howToFix: 'Remove the absolute phrase and let your evidence speak for itself.',
          startIndex: sentence.start,
          endIndex: sentence.end,
          excerpt: sentence.text.substring(0, 50) + '...',
        });
        break;
      }
    }
  }

  return issues;
}

// ============================================================================
// CHECKLIST GENERATION (Before You Submit)
// ============================================================================

function generateChecklist(text: string, issues: WritingIssue[]): ChecklistItem[] {
  const wordCount = countWords(text);
  const paragraphCount = countParagraphs(text);
  const paragraphs = getParagraphs(text);
  const sentences = getSentences(text);

  // Counts
  const grammarErrors = issues.filter(i => i.category === 'grammar' && i.severity === 'error').length;
  const unsupportedClaims = issues.filter(i => i.title.includes('Claim may need support')).length;
  const missingTransitions = issues.filter(i => i.title.includes('transition')).length;
  
  // Thesis check
  const hasThesis = paragraphs.length > 0 && ['argue', 'claim', 'believe', 'will discuss', 'this essay', 'this paper', 'position', 'contend'].some(
    t => paragraphs[0].text.toLowerCase().includes(t)
  );
  
  // Topic sentences check (first sentence of each body paragraph should be clear)
  const bodyParagraphs = paragraphs.slice(1, -1);
  const paragraphsWithTopicSentences = bodyParagraphs.filter(p => {
    const firstSentence = p.text.split(/[.!?]/)[0]?.toLowerCase() || '';
    // Topic sentences often have clear indicators
    return firstSentence.length > 20 && !firstSentence.startsWith('for example') && !firstSentence.startsWith('also');
  }).length;
  const topicSentenceRatio = bodyParagraphs.length > 0 ? paragraphsWithTopicSentences / bodyParagraphs.length : 1;

  // Conclusion check
  const hasConclusion = paragraphs.length > 0 && ['in conclusion', 'to summarize', 'in summary', 'therefore', 'thus', 'overall', 'finally'].some(
    t => paragraphs[paragraphs.length - 1].text.toLowerCase().includes(t)
  );

  // Evidence check
  const evidenceIndicators = ['because', 'since', 'for example', 'for instance', 'according to', 'research', 'study', 'evidence', 'shows', 'demonstrates'];
  const sentencesWithEvidence = sentences.filter(s => 
    evidenceIndicators.some(e => s.text.toLowerCase().includes(e))
  ).length;
  const evidenceRatio = sentences.length > 0 ? sentencesWithEvidence / sentences.length : 0;

  return [
    {
      id: 'thesis',
      label: 'Thesis clearly stated in introduction',
      status: hasThesis ? 'pass' : 'fail',
      detail: hasThesis ? 'Thesis statement detected' : 'Add a clear thesis in your first paragraph',
    },
    {
      id: 'topic-sentences',
      label: 'Each paragraph has a topic sentence',
      status: topicSentenceRatio >= 0.8 ? 'pass' : topicSentenceRatio >= 0.5 ? 'warning' : 'fail',
      detail: topicSentenceRatio >= 0.8 ? 'Topic sentences look good' : 'Start each paragraph with a clear main point',
    },
    {
      id: 'evidence',
      label: 'Claims supported with evidence',
      status: unsupportedClaims === 0 ? 'pass' : unsupportedClaims <= 2 ? 'warning' : 'fail',
      detail: unsupportedClaims === 0 ? 'Claims are supported' : `${unsupportedClaims} claim${unsupportedClaims > 1 ? 's' : ''} need${unsupportedClaims === 1 ? 's' : ''} support`,
    },
    {
      id: 'grammar',
      label: 'Grammar errors under threshold',
      status: grammarErrors === 0 ? 'pass' : grammarErrors <= 3 ? 'warning' : 'fail',
      detail: grammarErrors === 0 ? 'No major grammar errors' : `${grammarErrors} grammar error${grammarErrors > 1 ? 's' : ''} to fix`,
    },
    {
      id: 'structure',
      label: 'Clear introduction and conclusion',
      status: hasThesis && hasConclusion ? 'pass' : hasThesis || hasConclusion ? 'warning' : 'fail',
      detail: hasThesis && hasConclusion ? 'Structure looks complete' : !hasThesis ? 'Strengthen your introduction' : 'Add a conclusion',
    },
    {
      id: 'flow',
      label: 'Smooth transitions between ideas',
      status: missingTransitions === 0 ? 'pass' : missingTransitions <= 2 ? 'warning' : 'fail',
      detail: missingTransitions === 0 ? 'Transitions are smooth' : `${missingTransitions} paragraph${missingTransitions > 1 ? 's' : ''} could use transitions`,
    },
  ];
}

// ============================================================================
// PRIORITY GENERATION (Fix Order)
// ============================================================================

function generatePriorities(text: string, issues: WritingIssue[]): { fixFirst: PriorityItem[]; thenPolish: PriorityItem[] } {
  const paragraphs = getParagraphs(text);
  const fixFirst: PriorityItem[] = [];
  const thenPolish: PriorityItem[] = [];

  // Check for missing thesis
  const hasThesis = paragraphs.length > 0 && ['argue', 'claim', 'believe', 'will discuss', 'this essay', 'this paper'].some(
    t => paragraphs[0].text.toLowerCase().includes(t)
  );
  if (!hasThesis && paragraphs.length > 0) {
    fixFirst.push({ label: 'Missing thesis in introduction', category: 'structure' });
  }

  // Count unsupported claims
  const unsupportedClaims = issues.filter(i => i.title.includes('Claim may need support')).length;
  if (unsupportedClaims > 0) {
    fixFirst.push({ label: 'Unsupported claims', count: unsupportedClaims, category: 'argument' });
  }

  // Count grammar errors by severity
  const grammarErrors = issues.filter(i => i.category === 'grammar' && i.severity === 'error').length;
  if (grammarErrors > 0) {
    fixFirst.push({ label: 'Grammar errors', count: grammarErrors, category: 'grammar' });
  }

  // Missing conclusion
  const hasConclusion = paragraphs.length > 0 && ['in conclusion', 'to summarize', 'in summary', 'therefore', 'thus', 'overall'].some(
    t => paragraphs[paragraphs.length - 1].text.toLowerCase().includes(t)
  );
  if (!hasConclusion && paragraphs.length >= 3) {
    fixFirst.push({ label: 'Weak or missing conclusion', category: 'structure' });
  }

  // Polish items (less critical)
  const passiveVoice = issues.filter(i => i.title.includes('Passive voice')).length;
  if (passiveVoice > 0) {
    thenPolish.push({ label: 'Passive voice', count: passiveVoice, category: 'clarity' });
  }

  const longSentences = issues.filter(i => i.title.includes('Long sentence') || i.title.includes('Very long')).length;
  if (longSentences > 0) {
    thenPolish.push({ label: 'Long sentences', count: longSentences, category: 'clarity' });
  }

  const repetition = issues.filter(i => i.title.includes('repetition')).length;
  if (repetition > 0) {
    thenPolish.push({ label: 'Word repetition', count: repetition, category: 'clarity' });
  }

  const weakWords = issues.filter(i => i.title.includes('Weak') || i.title.includes('filler')).length;
  if (weakWords > 0) {
    thenPolish.push({ label: 'Filler words', count: weakWords, category: 'clarity' });
  }

  const transitions = issues.filter(i => i.title.includes('transition')).length;
  if (transitions > 0) {
    thenPolish.push({ label: 'Missing transitions', count: transitions, category: 'structure' });
  }

  return { fixFirst, thenPolish };
}

// ============================================================================
// QUALITY SCORE CALCULATION
// ============================================================================

function calculateQualityScore(text: string, issues: WritingIssue[]): number {
  const wordCount = countWords(text);
  if (wordCount < 50) return 0;

  let score = 100;

  // Deduct for issues based on severity
  for (const issue of issues) {
    if (issue.severity === 'error') score -= 5;
    else if (issue.severity === 'warning') score -= 2;
    else score -= 1;
  }

  // Bonus for good structure
  const paragraphCount = countParagraphs(text);
  if (paragraphCount >= 3 && paragraphCount <= 7) score += 5;

  // Bonus for adequate length
  if (wordCount >= 300) score += 5;
  if (wordCount >= 500) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// LANGUAGETOOL INTEGRATION
// ============================================================================

interface LanguageToolMatch {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: Array<{ value: string }>;
  rule: {
    id: string;
    description: string;
    category: { id: string; name: string };
  };
  context: {
    text: string;
    offset: number;
    length: number;
  };
}

interface LanguageToolResponse {
  matches: LanguageToolMatch[];
}

/**
 * Call LanguageTool API for grammar checking
 */
async function checkWithLanguageTool(text: string): Promise<WritingIssue[]> {
  try {
    const response = await fetch(LANGUAGETOOL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        language: 'en-US',
        enabledOnly: 'false',
      }),
    });

    if (!response.ok) {
      console.warn(`LanguageTool API error: ${response.status}`);
      return [];
    }

    const data: LanguageToolResponse = await response.json();
    
    return data.matches.map((match): WritingIssue => {
      // Map LanguageTool categories to our categories
      const categoryMap: Record<string, IssueCategory> = {
        'TYPOS': 'grammar',
        'GRAMMAR': 'grammar',
        'PUNCTUATION': 'grammar',
        'CASING': 'grammar',
        'CONFUSED_WORDS': 'grammar',
        'REDUNDANCY': 'clarity',
        'STYLE': 'clarity',
        'TYPOGRAPHY': 'grammar',
        'MISC': 'grammar',
      };

      const category = categoryMap[match.rule.category.id] || 'grammar';
      
      // Map severity based on rule category
      let severity: IssueSeverity = 'warning';
      if (match.rule.category.id === 'TYPOS' || match.rule.category.id === 'GRAMMAR') {
        severity = 'error';
      } else if (match.rule.category.id === 'STYLE' || match.rule.category.id === 'REDUNDANCY') {
        severity = 'suggestion';
      }

      // Get micro-suggestion from replacements (first suggestion only)
      const microSuggestion = match.replacements.length > 0 
        ? truncateSuggestion(match.replacements.slice(0, 3).map(r => r.value).join(', '))
        : undefined;

      // Extract excerpt from context
      const excerpt = match.context.text.substring(
        match.context.offset,
        match.context.offset + match.context.length
      );

      return {
        id: generateId(),
        category,
        severity,
        title: match.shortMessage || match.rule.description,
        description: match.message,
        howToFix: match.replacements.length > 0 
          ? `Consider: "${match.replacements[0].value}"`
          : 'Review and revise this section.',
        microSuggestion,
        startIndex: match.offset,
        endIndex: match.offset + match.length,
        excerpt: excerpt || text.substring(match.offset, match.offset + match.length),
      };
    });
  } catch (error) {
    console.warn('LanguageTool unavailable, falling back to heuristics:', error);
    return [];
  }
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze essay with optional LanguageTool integration.
 * If LANGUAGETOOL_MODE=api, uses LanguageTool for grammar.
 * Always runs heuristic checks for clarity, structure, argument.
 */
export async function analyzeEssayAsync(text: string): Promise<AnalysisResult> {
  if (!text || text.trim().length === 0) {
    return {
      qualityScore: 0,
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
      issues: [],
      checklist: generateChecklist('', []),
      fixFirst: [],
      thenPolish: [],
      categoryCounts: { grammar: 0, clarity: 0, structure: 0, argument: 0 },
    };
  }

  let grammarIssues: WritingIssue[] = [];

  // Use LanguageTool if configured
  if (LANGUAGETOOL_MODE === 'api') {
    grammarIssues = await checkWithLanguageTool(text);
    console.log(`LanguageTool returned ${grammarIssues.length} issues`);
  }

  // If LanguageTool didn't return results, fall back to heuristics
  if (grammarIssues.length === 0) {
    grammarIssues = [
      ...checkSpelling(text),
      ...checkPunctuation(text),
    ];
  }

  // Always run our heuristic checks for non-grammar categories
  const issues: WritingIssue[] = [
    ...grammarIssues,
    ...checkSentenceLength(text),
    ...checkPassiveVoice(text),
    ...checkWeakWords(text),
    ...checkWordRepetition(text),
    ...checkParagraphLength(text),
    ...checkTransitions(text),
    ...checkIntroConclusion(text),
    ...checkUnsupportedClaims(text),
    ...checkQuestionableStatements(text),
  ];

  // GUARDRAIL: Ensure no suggestion is too long
  for (const issue of issues) {
    if (issue.microSuggestion) {
      issue.microSuggestion = truncateSuggestion(issue.microSuggestion);
    }
  }

  // Sort by position
  issues.sort((a, b) => a.startIndex - b.startIndex);

  // Calculate stats
  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);
  const paragraphCount = countParagraphs(text);

  // Category counts
  const categoryCounts: Record<IssueCategory, number> = {
    grammar: issues.filter(i => i.category === 'grammar').length,
    clarity: issues.filter(i => i.category === 'clarity').length,
    structure: issues.filter(i => i.category === 'structure').length,
    argument: issues.filter(i => i.category === 'argument').length,
  };

  // Generate priorities
  const { fixFirst, thenPolish } = generatePriorities(text, issues);

  return {
    qualityScore: calculateQualityScore(text, issues),
    wordCount,
    sentenceCount,
    paragraphCount,
    readingTimeMinutes: calculateReadingTime(wordCount),
    issues,
    checklist: generateChecklist(text, issues),
    fixFirst,
    thenPolish,
    categoryCounts,
  };
}

/**
 * Synchronous version (uses heuristics only, for backwards compatibility)
 */
export function analyzeEssay(text: string): AnalysisResult {
  if (!text || text.trim().length === 0) {
    return {
      qualityScore: 0,
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
      issues: [],
      checklist: generateChecklist('', []),
      fixFirst: [],
      thenPolish: [],
      categoryCounts: { grammar: 0, clarity: 0, structure: 0, argument: 0 },
    };
  }

  // Collect all issues
  const issues: WritingIssue[] = [
    ...checkSpelling(text),
    ...checkPunctuation(text),
    ...checkSentenceLength(text),
    ...checkPassiveVoice(text),
    ...checkWeakWords(text),
    ...checkWordRepetition(text),
    ...checkParagraphLength(text),
    ...checkTransitions(text),
    ...checkIntroConclusion(text),
    ...checkUnsupportedClaims(text),
    ...checkQuestionableStatements(text),
  ];

  // GUARDRAIL: Ensure no suggestion is too long
  for (const issue of issues) {
    if (issue.microSuggestion) {
      issue.microSuggestion = truncateSuggestion(issue.microSuggestion);
    }
  }

  // Sort by position
  issues.sort((a, b) => a.startIndex - b.startIndex);

  // Calculate stats
  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);
  const paragraphCount = countParagraphs(text);

  // Category counts
  const categoryCounts: Record<IssueCategory, number> = {
    grammar: issues.filter(i => i.category === 'grammar').length,
    clarity: issues.filter(i => i.category === 'clarity').length,
    structure: issues.filter(i => i.category === 'structure').length,
    argument: issues.filter(i => i.category === 'argument').length,
  };

  // Generate priorities
  const { fixFirst, thenPolish } = generatePriorities(text, issues);

  return {
    qualityScore: calculateQualityScore(text, issues),
    wordCount,
    sentenceCount,
    paragraphCount,
    readingTimeMinutes: calculateReadingTime(wordCount),
    issues,
    checklist: generateChecklist(text, issues),
    fixFirst,
    thenPolish,
    categoryCounts,
  };
}

/**
 * Analyze a specific selection for targeted feedback
 */
export function analyzeSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number
): WritingIssue[] {
  const fullAnalysis = analyzeEssay(text);
  
  // Filter issues that overlap with selection
  return fullAnalysis.issues.filter(
    issue => issue.startIndex < selectionEnd && issue.endIndex > selectionStart
  );
}

// ============================================================================
// SIMPLIFICATION (Sentence-Level Only)
// ============================================================================

export interface SimplifyResult {
  original: string;
  simplified: string;
  changes: string[];
  disclaimer: string;
}

/**
 * Simplify a sentence by removing filler words and tightening phrasing.
 * GUARDRAIL: Only works on single sentences. Returns original if too long.
 */
export function simplifySentence(text: string): SimplifyResult {
  const original = text.trim();
  const changes: string[] = [];
  
  // GUARDRAIL: Reject if more than ~50 words (likely multiple sentences)
  const wordCount = original.split(/\s+/).length;
  if (wordCount > 50) {
    return {
      original,
      simplified: original,
      changes: ['Selection too long. Please select a single sentence.'],
      disclaimer: 'Simplification works best on single sentences.',
    };
  }

  let simplified = original;

  // 1. Remove filler words/phrases
  const fillerPatterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /\b(very|really|extremely|incredibly)\s+/gi, label: 'Removed intensifier' },
    { pattern: /\b(just|simply|merely)\s+/gi, label: 'Removed filler' },
    { pattern: /\b(basically|essentially|fundamentally)\s+/gi, label: 'Removed filler' },
    { pattern: /\b(actually|literally|virtually)\s+/gi, label: 'Removed filler' },
    { pattern: /\b(in order to)\b/gi, label: 'Shortened "in order to" → "to"' },
    { pattern: /\b(due to the fact that)\b/gi, label: 'Shortened "due to the fact that" → "because"' },
    { pattern: /\b(in spite of the fact that)\b/gi, label: 'Shortened phrase → "although"' },
    { pattern: /\b(at this point in time)\b/gi, label: 'Shortened "at this point in time" → "now"' },
    { pattern: /\b(for the purpose of)\b/gi, label: 'Shortened "for the purpose of" → "to"' },
    { pattern: /\b(in the event that)\b/gi, label: 'Shortened "in the event that" → "if"' },
    { pattern: /\b(it is important to note that)\s*/gi, label: 'Removed throat-clearing' },
    { pattern: /\b(it should be noted that)\s*/gi, label: 'Removed throat-clearing' },
    { pattern: /\b(it is worth mentioning that)\s*/gi, label: 'Removed throat-clearing' },
    { pattern: /\b(the fact that)\s+/gi, label: 'Removed "the fact that"' },
  ];

  for (const { pattern, label } of fillerPatterns) {
    if (pattern.test(simplified)) {
      changes.push(label);
    }
  }

  // Apply replacements
  simplified = simplified
    .replace(/\b(very|really|extremely|incredibly)\s+/gi, '')
    .replace(/\b(just|simply|merely)\s+/gi, '')
    .replace(/\b(basically|essentially|fundamentally)\s+/gi, '')
    .replace(/\b(actually|literally|virtually)\s+/gi, '')
    .replace(/\bin order to\b/gi, 'to')
    .replace(/\bdue to the fact that\b/gi, 'because')
    .replace(/\bin spite of the fact that\b/gi, 'although')
    .replace(/\bat this point in time\b/gi, 'now')
    .replace(/\bfor the purpose of\b/gi, 'to')
    .replace(/\bin the event that\b/gi, 'if')
    .replace(/\bit is important to note that\s*/gi, '')
    .replace(/\bit should be noted that\s*/gi, '')
    .replace(/\bit is worth mentioning that\s*/gi, '')
    .replace(/\bthe fact that\s+/gi, '');

  // 2. Fix common wordy constructions
  const wordyReplacements: Array<{ from: RegExp; to: string; label: string }> = [
    { from: /\bis able to\b/gi, to: 'can', label: '"is able to" → "can"' },
    { from: /\bhas the ability to\b/gi, to: 'can', label: '"has the ability to" → "can"' },
    { from: /\bmake a decision\b/gi, to: 'decide', label: '"make a decision" → "decide"' },
    { from: /\bcome to a conclusion\b/gi, to: 'conclude', label: '"come to a conclusion" → "conclude"' },
    { from: /\bgive consideration to\b/gi, to: 'consider', label: '"give consideration to" → "consider"' },
    { from: /\bmake an attempt\b/gi, to: 'try', label: '"make an attempt" → "try"' },
    { from: /\btake into consideration\b/gi, to: 'consider', label: '"take into consideration" → "consider"' },
    { from: /\ba large number of\b/gi, to: 'many', label: '"a large number of" → "many"' },
    { from: /\ba small number of\b/gi, to: 'few', label: '"a small number of" → "few"' },
    { from: /\bat the present time\b/gi, to: 'now', label: '"at the present time" → "now"' },
    { from: /\bin today's society\b/gi, to: 'today', label: '"in today\'s society" → "today"' },
  ];

  for (const { from, to, label } of wordyReplacements) {
    if (from.test(simplified)) {
      simplified = simplified.replace(from, to);
      changes.push(label);
    }
  }

  // 3. Clean up extra spaces and capitalize first letter
  simplified = simplified
    .replace(/\s+/g, ' ')
    .trim();
  
  if (simplified.length > 0) {
    simplified = simplified.charAt(0).toUpperCase() + simplified.slice(1);
  }

  // If no changes, say so
  if (simplified === original || changes.length === 0) {
    return {
      original,
      simplified: original,
      changes: ['No simplifications found. The sentence looks concise.'],
      disclaimer: 'This is a suggestion — you decide what works best.',
    };
  }

  return {
    original,
    simplified,
    changes,
    disclaimer: 'This is a suggestion — you decide what works best.',
  };
}
