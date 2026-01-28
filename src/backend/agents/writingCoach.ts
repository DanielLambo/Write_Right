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
 */

// ============================================================================
// TYPES
// ============================================================================

export type IssueSeverity = 'error' | 'warning' | 'suggestion';
export type IssueCategory = 'grammar' | 'clarity' | 'structure' | 'argument';

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
  checked: boolean;
  tip: string;
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
// CHECKLIST GENERATION
// ============================================================================

function generateChecklist(text: string, issues: WritingIssue[]): ChecklistItem[] {
  const wordCount = countWords(text);
  const paragraphCount = countParagraphs(text);
  const paragraphs = getParagraphs(text);

  const grammarIssues = issues.filter(i => i.category === 'grammar' && i.severity === 'error').length;
  const hasTransitions = paragraphs.length < 3 || issues.filter(i => i.title.includes('transition')).length < paragraphs.length - 2;
  const hasThesis = paragraphs.length > 0 && ['argue', 'claim', 'believe', 'will discuss', 'this essay'].some(
    t => paragraphs[0].text.toLowerCase().includes(t)
  );

  return [
    {
      id: 'grammar',
      label: 'No major grammar errors',
      checked: grammarIssues === 0,
      tip: grammarIssues > 0 ? `Found ${grammarIssues} grammar issues to fix.` : 'Grammar looks good!',
    },
    {
      id: 'length',
      label: 'Sufficient length (250+ words)',
      checked: wordCount >= 250,
      tip: wordCount < 250 ? `Currently ${wordCount} words. Consider expanding your ideas.` : `${wordCount} words — good length.`,
    },
    {
      id: 'paragraphs',
      label: 'Multiple paragraphs (3+)',
      checked: paragraphCount >= 3,
      tip: paragraphCount < 3 ? 'Add more paragraphs to organize your ideas.' : `${paragraphCount} paragraphs — well structured.`,
    },
    {
      id: 'thesis',
      label: 'Clear thesis/main argument',
      checked: hasThesis,
      tip: hasThesis ? 'Thesis detected in introduction.' : 'Consider adding a clearer thesis statement.',
    },
    {
      id: 'transitions',
      label: 'Transitions between paragraphs',
      checked: hasTransitions,
      tip: hasTransitions ? 'Transitions look good.' : 'Add transition words between some paragraphs.',
    },
    {
      id: 'conclusion',
      label: 'Strong conclusion',
      checked: paragraphs.length > 0 && ['conclusion', 'summarize', 'summary', 'therefore', 'thus'].some(
        t => paragraphs[paragraphs.length - 1].text.toLowerCase().includes(t)
      ),
      tip: 'End with a conclusion that ties back to your thesis.',
    },
  ];
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
// MAIN ANALYSIS FUNCTION
// ============================================================================

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

  return {
    qualityScore: calculateQualityScore(text, issues),
    wordCount,
    sentenceCount,
    paragraphCount,
    readingTimeMinutes: calculateReadingTime(wordCount),
    issues,
    checklist: generateChecklist(text, issues),
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
