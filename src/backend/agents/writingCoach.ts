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
  readability: ReadabilityResult;
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
  // Original 20
  'teh': 'the', 'adn': 'and', 'recieve': 'receive', 'seperate': 'separate',
  'occured': 'occurred', 'definately': 'definitely', 'accomodate': 'accommodate',
  'occurence': 'occurrence', 'independant': 'independent', 'neccessary': 'necessary',
  'untill': 'until', 'wierd': 'weird', 'thier': 'their', 'freind': 'friend',
  'goverment': 'government', 'enviroment': 'environment', 'begining': 'beginning',
  'beleive': 'believe', 'acheive': 'achieve', 'arguement': 'argument',
  // Common academic misspellings
  'alot': 'a lot', 'noticable': 'noticeable', 'occassion': 'occasion',
  'privelege': 'privilege', 'priviledge': 'privilege', 'refered': 'referred',
  'referance': 'reference', 'relavant': 'relevant', 'relevent': 'relevant',
  'responsable': 'responsible', 'succesful': 'successful', 'successfull': 'successful',
  'tommorrow': 'tomorrow', 'tommorow': 'tomorrow', 'truely': 'truly',
  'writting': 'writing', 'writeing': 'writing', 'grammer': 'grammar',
  'calender': 'calendar', 'commitee': 'committee', 'concious': 'conscious',
  'conscence': 'conscience', 'continous': 'continuous', 'curiousity': 'curiosity',
  'dissapear': 'disappear', 'dissapoint': 'disappoint', 'embarass': 'embarrass',
  'exagerate': 'exaggerate', 'excercise': 'exercise', 'existance': 'existence',
  'experiance': 'experience', 'foriegn': 'foreign', 'fourty': 'forty',
  'guage': 'gauge', 'gaurd': 'guard', 'harrass': 'harass', 'hygeine': 'hygiene',
  'immedietly': 'immediately', 'immediatly': 'immediately', 'innoculate': 'inoculate',
  'inteligent': 'intelligent', 'knowlege': 'knowledge', 'liason': 'liaison',
  'maintainance': 'maintenance', 'maintenence': 'maintenance', 'millenium': 'millennium',
  'mischevious': 'mischievous', 'misspel': 'misspell', 'neighbourhod': 'neighborhood',
  'occassionally': 'occasionally', 'parliment': 'parliament', 'persistant': 'persistent',
  'personel': 'personnel', 'posession': 'possession', 'potatos': 'potatoes',
  'preceed': 'precede', 'procede': 'proceed', 'professer': 'professor',
  'pronounciation': 'pronunciation', 'publically': 'publicly', 'questionaire': 'questionnaire',
  'recomend': 'recommend', 'reccomend': 'recommend', 'rythm': 'rhythm',
  'seize': 'seize', 'sieze': 'seize', 'similiar': 'similar',
  'supercede': 'supersede', 'surprize': 'surprise', 'temperture': 'temperature',
  'tendancy': 'tendency', 'therefor': 'therefore', 'threshhold': 'threshold',
  'tounge': 'tongue', 'tyrany': 'tyranny', 'vaccuum': 'vacuum',
  'vegetable': 'vegetable', 'villian': 'villain', 'wether': 'whether',
  'wich': 'which', 'wendsday': 'Wednesday', 'wensday': 'Wednesday',
  // Student essay common errors
  'alright': 'all right', 'appearently': 'apparently', 'basicly': 'basically',
  'beautifull': 'beautiful', 'becuase': 'because', 'buisness': 'business',
  'catagory': 'category', 'charactor': 'character', 'collegue': 'colleague',
  'comparision': 'comparison', 'competetion': 'competition', 'completly': 'completely',
  'critisism': 'criticism', 'critisise': 'criticize', 'descision': 'decision',
  'develope': 'develop', 'developement': 'development', 'diffrent': 'different',
  'dilema': 'dilemma', 'disipline': 'discipline', 'doesnt': "doesn't",
  'efficent': 'efficient', 'enviorment': 'environment', 'equiptment': 'equipment',
  'especally': 'especially', 'explaination': 'explanation', 'familar': 'familiar',
  'fasinating': 'fascinating', 'fianlly': 'finally', 'flourescent': 'fluorescent',
  'geneology': 'genealogy', 'generaly': 'generally', 'govermnent': 'government',
  'happend': 'happened', 'harasment': 'harassment', 'heighth': 'height',
  'heirarchy': 'hierarchy', 'humourous': 'humorous', 'ignorence': 'ignorance',
  'imaginery': 'imaginary', 'importent': 'important', 'incidently': 'incidentally',
  'influance': 'influence', 'innocense': 'innocence', 'iresistable': 'irresistible',
  'judgement': 'judgment', 'lenght': 'length', 'libary': 'library',
  'litterature': 'literature', 'lonliness': 'loneliness', 'managment': 'management',
  'medeval': 'medieval', 'momento': 'memento', 'naturaly': 'naturally',
  'necesary': 'necessary', 'occasionaly': 'occasionally', 'oppertunity': 'opportunity',
  'orignal': 'original', 'paralell': 'parallel', 'particulary': 'particularly',
  'pasttime': 'pastime', 'percieve': 'perceive', 'performence': 'performance',
  'permanant': 'permanent', 'persue': 'pursue', 'playwrite': 'playwright',
  'politican': 'politician', 'posible': 'possible', 'practicle': 'practical',
  'prefered': 'preferred', 'prejudise': 'prejudice', 'principel': 'principal',
  'probaly': 'probably', 'proffessional': 'professional', 'programing': 'programming',
  'promiss': 'promise', 'psycology': 'psychology', 'realy': 'really',
  'recieved': 'received', 'recognise': 'recognize', 'religous': 'religious',
  'remeber': 'remember', 'repitition': 'repetition', 'resistence': 'resistance',
  'restraunt': 'restaurant', 'sacrefice': 'sacrifice', 'safty': 'safety',
  'scedule': 'schedule', 'scholership': 'scholarship', 'sentance': 'sentence',
  'significent': 'significant', 'sincerly': 'sincerely', 'speach': 'speech',
  'strenght': 'strength', 'studing': 'studying', 'subconscious': 'subconscious',
  'supposidly': 'supposedly', 'technicly': 'technically', 'thouroughly': 'thoroughly',
  'tradgedy': 'tragedy', 'transfered': 'transferred', 'unforseen': 'unforeseen',
  'unfortunatly': 'unfortunately', 'unneccesary': 'unnecessary', 'usefull': 'useful',
  'usally': 'usually', 'vegatable': 'vegetable', 'visious': 'vicious',
  'wieght': 'weight', 'wellfare': 'welfare', 'whitch': 'which',
};

// Commonly confused word pairs with context-free detection
const CONFUSED_WORDS: Array<{ pattern: RegExp; message: string; fix: string; suggestion: string }> = [
  { pattern: /\btheir\s+(is|are|was|were|has|have|will|would|could|should)\b/gi, message: '"their" (possessive) may be confused with "there" (location/existence).', fix: 'Use "there" for location or "there is/are" for existence.', suggestion: 'there' },
  { pattern: /\bthere\s+(car|house|book|dog|cat|name|friend|mother|father|teacher|work|school|opinion)\b/gi, message: '"there" may be confused with "their" (possessive).', fix: 'Use "their" to show possession (their car, their book).', suggestion: 'their' },
  { pattern: /\byour\s+(a|an|the|going|welcome|right|wrong|not|very|so|too|also)\b/gi, message: '"your" (possessive) may be confused with "you\'re" (you are).', fix: 'If you mean "you are," write "you\'re."', suggestion: "you're" },
  { pattern: /\bits\s+(a|an|the|been|not|very|going|important|clear|obvious|possible|necessary)\b/gi, message: 'Check if you mean "it\'s" (it is) instead of "its" (possessive).', fix: 'Use "it\'s" for "it is" and "its" for possession.', suggestion: "it's" },
  { pattern: /\bit's\s+(own|self)\b/gi, message: '"it\'s" means "it is." For possession, use "its."', fix: 'Write "its own" (no apostrophe for possessive "its").', suggestion: 'its' },
  { pattern: /\bthen\s+(I|you|he|she|we|they)\b/gi, message: 'Check if you mean "than" (comparison) instead of "then" (time).', fix: '"Than" compares; "then" indicates sequence.', suggestion: 'than' },
  { pattern: /\bmore\s+then\b/gi, message: '"more then" should be "more than" (comparison).', fix: 'Use "than" for comparisons.', suggestion: 'more than' },
  { pattern: /\bless\s+then\b/gi, message: '"less then" should be "less than."', fix: 'Use "than" for comparisons.', suggestion: 'less than' },
  { pattern: /\bbetter\s+then\b/gi, message: '"better then" should be "better than."', fix: 'Use "than" for comparisons.', suggestion: 'better than' },
  { pattern: /\beffect\s+(on|the|a|an)\b.*\bwill\s+effect\b/gi, message: '"effect" is usually a noun. The verb form is typically "affect."', fix: 'Use "affect" as a verb (to affect something) and "effect" as a noun (the effect).', suggestion: 'affect' },
  { pattern: /\bwould\s+of\b/gi, message: '"would of" should be "would have" or "would\'ve."', fix: 'Write "would have" — "of" is not correct here.', suggestion: "would have" },
  { pattern: /\bcould\s+of\b/gi, message: '"could of" should be "could have" or "could\'ve."', fix: 'Write "could have."', suggestion: "could have" },
  { pattern: /\bshould\s+of\b/gi, message: '"should of" should be "should have" or "should\'ve."', fix: 'Write "should have."', suggestion: "should have" },
  { pattern: /\balot\b/gi, message: '"alot" is not a word. It should be "a lot."', fix: 'Write "a lot" as two words.', suggestion: 'a lot' },
  { pattern: /\bto\s+(loud|fast|slow|much|many|big|small|hard|easy|late|early|soon|long|short|far|close|high|low|hot|cold|old|young|new)\b/gi, message: 'Check if you mean "too" (excessively) instead of "to."', fix: 'Use "too" to mean "excessively" (too loud, too fast).', suggestion: 'too' },
  { pattern: /\blose\s+(the|a|my|your|his|her|our|their).*\bloose\b/gi, message: 'Check "loose" vs "lose." "Loose" means not tight; "lose" means to misplace.', fix: '"Lose" = misplace/fail. "Loose" = not tight.', suggestion: 'lose' },
  { pattern: /\baccept\b.*\bexcept\b|\bexcept\b.*\baccept\b/gi, message: 'Check "accept" vs "except." "Accept" means to receive; "except" means excluding.', fix: '"Accept" = receive/agree. "Except" = excluding.', suggestion: '' },
];

const WEAK_WORDS = [
  'very', 'really', 'just', 'basically', 'actually', 'literally', 'things', 'stuff',
  'somewhat', 'quite', 'rather', 'perhaps', 'somehow',
];

const HEDGING_PHRASES: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /\bI think that\b/gi, description: '"I think that" weakens your point. State it directly.' },
  { pattern: /\bI feel like\b/gi, description: '"I feel like" is informal. State your position directly.' },
  { pattern: /\bI believe that\b(?!.*\b(because|since|as|evidence|research)\b)/gi, description: '"I believe that" without evidence reads as unsupported opinion.' },
  { pattern: /\bin my opinion\b/gi, description: '"In my opinion" is redundant — the reader knows it\'s your writing.' },
  { pattern: /\bit seems like\b/gi, description: '"It seems like" is vague. Be specific about what you observe.' },
  { pattern: /\bit appears that\b/gi, description: '"It appears that" hedges. State what the evidence shows.' },
  { pattern: /\bmight possibly\b/gi, description: '"Might possibly" is a double hedge. Use one or the other.' },
  { pattern: /\bsort of\b/gi, description: '"Sort of" is vague and informal for academic writing.' },
  { pattern: /\bkind of\b/gi, description: '"Kind of" is vague and informal for academic writing.' },
  { pattern: /\bneedless to say\b/gi, description: 'If it\'s needless to say, don\'t say it. Just state the point.' },
];

const CLICHES: string[] = [
  'at the end of the day', 'it goes without saying', 'in today\'s society',
  'since the dawn of time', 'throughout history', 'in this day and age',
  'each and every', 'first and foremost', 'last but not least',
  'few and far between', 'think outside the box', 'at the end of the day',
  'when all is said and done', 'the bottom line is', 'it is what it is',
  'only time will tell', 'better late than never', 'easier said than done',
  'actions speak louder than words', 'a double-edged sword',
  'tip of the iceberg', 'food for thought', 'a level playing field',
  'the fact of the matter is', 'at this point in time', 'moving forward',
  'paradigm shift', 'low-hanging fruit', 'game changer', 'deep dive',
  'circle back', 'push the envelope', 'raise the bar',
];

const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|been|being)\s+(\w+ed)\b/gi,
  /\b(is|are|was|were|been|being)\s+(\w+en)\b/gi,
  /\b(has|have|had)\s+been\s+(\w+ed)\b/gi,
  /\b(could|would|should|might|may|can|will)\s+be\s+(\w+ed)\b/gi,
  /\b(could|would|should|might|may|can|will)\s+be\s+(\w+en)\b/gi,
  /\b(has|have|had)\s+been\s+(\w+en)\b/gi,
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

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;
  // Remove trailing silent 'e'
  word = word.replace(/e$/, '');
  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  const count = vowelGroups ? vowelGroups.length : 1;
  return Math.max(1, count);
}

function countTotalSyllables(text: string): number {
  const words = text.match(/\b[a-zA-Z]+\b/g) || [];
  return words.reduce((total, word) => total + countSyllables(word), 0);
}

export interface ReadabilityResult {
  /** Flesch Reading Ease score (0-100, higher = easier) */
  fleschReadingEase: number;
  /** Flesch-Kincaid Grade Level (US grade level) */
  gradeLevel: number;
  /** Human-readable label */
  label: string;
  /** Short description of the audience */
  audience: string;
}

function calculateReadability(text: string): ReadabilityResult {
  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);
  const syllableCount = countTotalSyllables(text);

  if (wordCount < 10 || sentenceCount === 0) {
    return { fleschReadingEase: 0, gradeLevel: 0, label: 'Too short', audience: 'Write more to calculate' };
  }

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;

  // Flesch Reading Ease = 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const fleschReadingEase = Math.max(0, Math.min(100,
    Math.round(206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord)
  ));

  // Flesch-Kincaid Grade Level = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  const gradeLevel = Math.max(1, Math.min(18,
    Math.round((0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59) * 10) / 10
  ));

  let label: string;
  let audience: string;
  if (fleschReadingEase >= 80) {
    label = 'Very Easy';
    audience = '6th grade or below';
  } else if (fleschReadingEase >= 70) {
    label = 'Easy';
    audience = '7th grade';
  } else if (fleschReadingEase >= 60) {
    label = 'Standard';
    audience = '8th-9th grade';
  } else if (fleschReadingEase >= 50) {
    label = 'Moderate';
    audience = '10th-12th grade';
  } else if (fleschReadingEase >= 30) {
    label = 'Difficult';
    audience = 'College level';
  } else {
    label = 'Very Difficult';
    audience = 'College graduate';
  }

  return { fleschReadingEase, gradeLevel, label, audience };
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

function checkConfusedWords(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  for (const { pattern, message, fix, suggestion } of CONFUSED_WORDS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        id: generateId(),
        category: 'grammar',
        severity: 'error',
        title: 'Commonly confused word',
        description: message,
        howToFix: fix,
        microSuggestion: suggestion || undefined,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        excerpt: match[0],
      });
    }
  }
  return issues;
}

function checkRunOnSentences(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  for (const sentence of sentences) {
    const wordCount = countWords(sentence.text);
    // Comma splice: two independent clauses joined by just a comma (no conjunction)
    const commaSplicePattern = /,\s+(?!(and|but|or|nor|for|yet|so|which|who|whom|whose|that|where|when|while|although|because|since|if|unless|until|after|before|however|moreover|furthermore|additionally|consequently|therefore|nevertheless|nonetheless)\b)[A-Z][a-z]/g;
    let match;
    while ((match = commaSplicePattern.exec(sentence.text)) !== null) {
      if (wordCount > 15) {
        issues.push({
          id: generateId(),
          category: 'grammar',
          severity: 'warning',
          title: 'Possible run-on sentence',
          description: 'This may be a comma splice — two independent clauses joined by just a comma.',
          howToFix: 'Add a conjunction (and, but, so), use a semicolon, or split into two sentences.',
          microSuggestion: '; or . Instead of ,',
          startIndex: sentence.start + match.index,
          endIndex: sentence.start + match.index + match[0].length,
          excerpt: sentence.text.substring(Math.max(0, match.index - 10), match.index + 20),
        });
        break;
      }
    }
  }
  return issues;
}

function checkSentenceFragments(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  for (const sentence of sentences) {
    const trimmed = sentence.text.trim();
    const wordCount = countWords(trimmed);

    if (wordCount < 4) continue; // Too short to analyze meaningfully

    // Fragments starting with subordinating conjunctions without a main clause
    const subordinators = /^(although|because|since|while|if|unless|until|after|before|when|whenever|whereas|even though|even if|in order that|so that|provided that)\b/i;
    if (subordinators.test(trimmed) && wordCount < 12) {
      // Check if it has a main clause (contains a comma followed by subject+verb)
      if (!trimmed.includes(',') || trimmed.split(',').length < 2) {
        issues.push({
          id: generateId(),
          category: 'grammar',
          severity: 'warning',
          title: 'Possible sentence fragment',
          description: 'This starts with a subordinating word and may not be a complete sentence.',
          howToFix: 'Connect this to the previous or next sentence, or add a main clause.',
          startIndex: sentence.start,
          endIndex: sentence.end,
          excerpt: trimmed.substring(0, 50),
        });
      }
    }

    // Fragments starting with -ing words (participial phrases)
    if (/^[A-Z][a-z]+ing\b/.test(trimmed) && wordCount < 8 && !trimmed.includes(',')) {
      issues.push({
        id: generateId(),
        category: 'grammar',
        severity: 'suggestion',
        title: 'Possible sentence fragment',
        description: 'This starts with an -ing word and may be an incomplete thought.',
        howToFix: 'Make sure this is a complete sentence with a subject and verb.',
        startIndex: sentence.start,
        endIndex: sentence.end,
        excerpt: trimmed.substring(0, 50),
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
    
    const currentWords: string[] = current.match(/\b[a-z]{5,}\b/g) || [];
    const nextWords: string[] = next.match(/\b[a-z]{5,}\b/g) || [];
    
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

function checkCliches(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const lower = text.toLowerCase();

  for (const cliche of CLICHES) {
    let idx = lower.indexOf(cliche);
    while (idx !== -1) {
      issues.push({
        id: generateId(),
        category: 'clarity',
        severity: 'suggestion',
        title: 'Cliche detected',
        description: `"${cliche}" is an overused phrase that weakens your writing.`,
        howToFix: 'Replace with specific, original language that says exactly what you mean.',
        startIndex: idx,
        endIndex: idx + cliche.length,
        excerpt: text.substring(idx, idx + cliche.length),
      });
      idx = lower.indexOf(cliche, idx + cliche.length);
    }
  }
  return issues;
}

function checkHedgingLanguage(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];

  for (const { pattern, description } of HEDGING_PHRASES) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        id: generateId(),
        category: 'clarity',
        severity: 'suggestion',
        title: 'Hedging language',
        description,
        howToFix: 'State your point directly. Let evidence support your claim.',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        excerpt: match[0],
      });
    }
  }
  return issues;
}

function checkSentenceVariety(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  if (sentences.length < 5) return issues;

  // Check for repeated sentence starts
  const starts: Record<string, number[]> = {};
  for (let i = 0; i < sentences.length; i++) {
    const firstWord = sentences[i].text.trim().split(/\s+/)[0]?.toLowerCase() || '';
    if (!starts[firstWord]) starts[firstWord] = [];
    starts[firstWord].push(i);
  }

  for (const [word, indices] of Object.entries(starts)) {
    if (indices.length >= 3 && !['the', 'a', 'an'].includes(word)) {
      issues.push({
        id: generateId(),
        category: 'clarity',
        severity: 'suggestion',
        title: 'Repetitive sentence starts',
        description: `${indices.length} sentences start with "${word}." Varying your openings improves flow.`,
        howToFix: 'Try starting with a different word, a transition, or by rearranging the sentence.',
        startIndex: sentences[indices[2]].start,
        endIndex: sentences[indices[2]].end,
        excerpt: sentences[indices[2]].text.substring(0, 40) + '...',
      });
    }
  }

  // Check for monotonous sentence lengths (all similar)
  const lengths = sentences.map(s => countWords(s.text));
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLen, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 3 && sentences.length >= 6) {
    issues.push({
      id: generateId(),
      category: 'clarity',
      severity: 'suggestion',
      title: 'Monotonous sentence rhythm',
      description: `Your sentences average ${Math.round(avgLen)} words with little variation. Mix short and long sentences for better rhythm.`,
      howToFix: 'Alternate between short punchy sentences and longer detailed ones.',
      startIndex: sentences[0].start,
      endIndex: sentences[Math.min(2, sentences.length - 1)].end,
      excerpt: 'Overall pattern...',
    });
  }

  return issues;
}

function checkVagueOpeners(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  const vaguePatterns: Array<{ pattern: RegExp; desc: string }> = [
    { pattern: /^There (is|are|was|were) /i, desc: '"There is/are" openings are weak. Lead with the actual subject.' },
    { pattern: /^It is (important|clear|obvious|interesting|worth noting|necessary|evident) /i, desc: 'This opener buries the real subject. State it directly.' },
    { pattern: /^This is /i, desc: '"This is" without a clear referent can be vague.' },
  ];

  for (const sentence of sentences) {
    const trimmed = sentence.text.trim();
    for (const { pattern, desc } of vaguePatterns) {
      if (pattern.test(trimmed)) {
        issues.push({
          id: generateId(),
          category: 'clarity',
          severity: 'suggestion',
          title: 'Weak sentence opener',
          description: desc,
          howToFix: 'Rewrite to lead with the specific subject or action.',
          startIndex: sentence.start,
          endIndex: Math.min(sentence.start + 30, sentence.end),
          excerpt: trimmed.substring(0, 40),
        });
        break;
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

function checkRepeatedParagraphOpeners(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const paragraphs = getParagraphs(text);

  if (paragraphs.length < 3) return issues;

  const openers: Record<string, number> = {};
  for (const para of paragraphs) {
    const firstWords = para.text.trim().split(/\s+/).slice(0, 3).join(' ').toLowerCase();
    openers[firstWords] = (openers[firstWords] || 0) + 1;
  }

  for (const [opener, count] of Object.entries(openers)) {
    if (count >= 2) {
      const matchingPara = paragraphs.find(p => p.text.trim().toLowerCase().startsWith(opener));
      if (matchingPara) {
        issues.push({
          id: generateId(),
          category: 'structure',
          severity: 'suggestion',
          title: 'Repeated paragraph opening',
          description: `${count} paragraphs start with "${opener}..." Varying openings improves flow.`,
          howToFix: 'Rephrase one of the paragraph openings to add variety.',
          startIndex: matchingPara.start,
          endIndex: Math.min(matchingPara.start + 40, matchingPara.end),
          excerpt: matchingPara.text.substring(0, 40) + '...',
        });
      }
    }
  }
  return issues;
}

// ============================================================================
// ARGUMENT & EVIDENCE CHECKS
// ============================================================================

function checkUnsupportedClaims(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  const claimIndicators = [
    'should', 'must', 'always', 'never', 'all', 'none', 'best', 'worst',
    'obviously', 'need to', 'have to', 'essential', 'crucial', 'vital',
    'undeniable', 'indisputable', 'without doubt', 'unquestionable',
    'every', 'no one', 'everyone', 'impossible', 'only way',
  ];
  const evidenceIndicators = [
    'because', 'since', 'for example', 'for instance', 'according to',
    'research shows', 'studies', 'evidence', 'data suggests', 'found that',
    'demonstrates', 'indicates', 'survey', 'report', 'analysis',
    'statistics', 'percent', '%', 'cited', 'published', 'journal',
    'experiment', 'as shown', 'proves', 'confirmed',
  ];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].text.toLowerCase();
    const hasClaim = claimIndicators.some(c => sentence.includes(c));

    if (hasClaim) {
      // Check this sentence and the next 2 for evidence
      const hasEvidence = evidenceIndicators.some(e => sentence.includes(e));
      const next1HasEvidence = sentences[i + 1] && evidenceIndicators.some(e => sentences[i + 1].text.toLowerCase().includes(e));
      const next2HasEvidence = sentences[i + 2] && evidenceIndicators.some(e => sentences[i + 2].text.toLowerCase().includes(e));

      if (!hasEvidence && !next1HasEvidence && !next2HasEvidence) {
        issues.push({
          id: generateId(),
          category: 'argument',
          severity: 'warning',
          title: 'Claim may need support',
          description: 'This sentence makes a strong claim but no supporting evidence follows within the next two sentences.',
          howToFix: 'Follow this claim with "because...", an example, a statistic, or a citation.',
          startIndex: sentences[i].start,
          endIndex: sentences[i].end,
          excerpt: sentences[i].text.substring(0, 50) + (sentences[i].text.length > 50 ? '...' : ''),
        });
      }
    }
  }

  return issues;
}

function checkQuestionableStatements(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  const absolutes = [
    'everyone knows', 'it is obvious', 'clearly', 'undoubtedly', 'without question',
    'no one can deny', 'it is well known', 'it is a fact that', 'there is no doubt',
    'any reasonable person', 'common sense tells us', 'the truth is',
    'it stands to reason', 'nobody disagrees', 'we all know',
    'as everyone knows', 'of course', 'naturally', 'goes without saying',
  ];

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
          excerpt: sentence.text.substring(0, 50) + (sentence.text.length > 50 ? '...' : ''),
        });
        break;
      }
    }
  }

  return issues;
}

function checkPersonalOpinionOveruse(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = getSentences(text);

  const opinionPhrases = [/\bI think\b/gi, /\bI feel\b/gi, /\bI believe\b/gi, /\bin my opinion\b/gi, /\bpersonally\b/gi];
  let totalOpinionCount = 0;

  for (const pattern of opinionPhrases) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      totalOpinionCount++;
    }
  }

  if (totalOpinionCount >= 4 && sentences.length > 0) {
    const ratio = totalOpinionCount / sentences.length;
    if (ratio > 0.15) {
      issues.push({
        id: generateId(),
        category: 'argument',
        severity: 'warning',
        title: 'Over-reliance on personal opinion',
        description: `You use "I think/believe/feel" ${totalOpinionCount} times. In academic writing, let evidence support your claims instead.`,
        howToFix: 'Replace opinion phrases with evidence-backed statements. Instead of "I think X," write "Evidence shows X."',
        startIndex: 0,
        endIndex: Math.min(50, text.length),
        excerpt: 'Overall pattern',
      });
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

  // Sentence variety check
  const lengths = sentences.map(s => countWords(s.text));
  const avgLen = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const sentVariance = lengths.length > 0 ? lengths.reduce((sum, len) => sum + Math.pow(len - avgLen, 2), 0) / lengths.length : 0;
  const hasSentenceVariety = Math.sqrt(sentVariance) >= 4;

  // Readability check
  const readability = calculateReadability(text);
  const readabilityOk = readability.fleschReadingEase >= 30 && readability.fleschReadingEase <= 80;

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
    {
      id: 'variety',
      label: 'Sentence variety and rhythm',
      status: hasSentenceVariety ? 'pass' : sentences.length < 5 ? 'warning' : 'fail',
      detail: hasSentenceVariety ? 'Good mix of sentence lengths' : 'Mix short and long sentences for better rhythm',
    },
    {
      id: 'readability',
      label: 'Readability appropriate for audience',
      status: readability.fleschReadingEase === 0 ? 'warning' : readabilityOk ? 'pass' : 'warning',
      detail: readability.fleschReadingEase === 0 ? 'Write more to assess' : `Grade ${readability.gradeLevel} (${readability.label})`,
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

  // Confused words (critical - these are real errors)
  const confusedWords = issues.filter(i => i.title === 'Commonly confused word').length;
  if (confusedWords > 0) {
    fixFirst.push({ label: 'Confused words (their/there, your/you\'re, etc.)', count: confusedWords, category: 'grammar' });
  }

  // Run-on sentences
  const runOns = issues.filter(i => i.title.includes('run-on')).length;
  if (runOns > 0) {
    fixFirst.push({ label: 'Run-on sentences', count: runOns, category: 'grammar' });
  }

  // Personal opinion overuse
  const opinionOveruse = issues.filter(i => i.title.includes('Over-reliance')).length;
  if (opinionOveruse > 0) {
    fixFirst.push({ label: 'Too much "I think/believe/feel"', category: 'argument' });
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

  const cliches = issues.filter(i => i.title.includes('Cliche')).length;
  if (cliches > 0) {
    thenPolish.push({ label: 'Cliches', count: cliches, category: 'clarity' });
  }

  const hedging = issues.filter(i => i.title.includes('Hedging')).length;
  if (hedging > 0) {
    thenPolish.push({ label: 'Hedging language', count: hedging, category: 'clarity' });
  }

  const transitions = issues.filter(i => i.title.includes('transition')).length;
  if (transitions > 0) {
    thenPolish.push({ label: 'Missing transitions', count: transitions, category: 'structure' });
  }

  const vagueOpeners = issues.filter(i => i.title.includes('Weak sentence opener')).length;
  if (vagueOpeners > 0) {
    thenPolish.push({ label: 'Weak sentence openers', count: vagueOpeners, category: 'clarity' });
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

  // Deduct for issues based on severity (diminishing returns to avoid crushing score)
  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const suggestions = issues.filter(i => i.severity === 'suggestion').length;

  score -= Math.min(30, errors * 4);
  score -= Math.min(20, warnings * 2);
  score -= Math.min(15, suggestions * 1);

  // POSITIVE SIGNALS — reward good writing practices
  const paragraphs = getParagraphs(text);
  const sentences = getSentences(text);
  const paragraphCount = paragraphs.length;

  // Good structure: 3-7 paragraphs
  if (paragraphCount >= 3 && paragraphCount <= 7) score += 3;

  // Adequate length
  if (wordCount >= 300) score += 2;
  if (wordCount >= 500) score += 2;

  // Sentence variety (good standard deviation in sentence lengths)
  if (sentences.length >= 4) {
    const lengths = sentences.map(s => countWords(s.text));
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
    if (Math.sqrt(variance) >= 4) score += 3; // Good variety
  }

  // Uses transitions
  const transitionCount = TRANSITION_WORDS.filter(t =>
    text.toLowerCase().includes(t)
  ).length;
  if (transitionCount >= 2) score += 2;
  if (transitionCount >= 4) score += 2;

  // Uses evidence language
  const evidenceWords = ['because', 'for example', 'according to', 'research', 'evidence', 'study', 'data', 'shows', 'demonstrates'];
  const evidenceCount = evidenceWords.filter(e => text.toLowerCase().includes(e)).length;
  if (evidenceCount >= 2) score += 2;
  if (evidenceCount >= 4) score += 2;

  // Has thesis-like language in intro
  if (paragraphs.length > 0) {
    const intro = paragraphs[0].text.toLowerCase();
    if (['argue', 'claim', 'believe', 'will discuss', 'this essay', 'this paper', 'thesis', 'contend', 'position'].some(t => intro.includes(t))) {
      score += 3;
    }
  }

  // Has conclusion signals
  if (paragraphs.length >= 3) {
    const conclusion = paragraphs[paragraphs.length - 1].text.toLowerCase();
    if (['in conclusion', 'to summarize', 'in summary', 'therefore', 'thus', 'overall'].some(t => conclusion.includes(t))) {
      score += 2;
    }
  }

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
      readability: { fleschReadingEase: 0, gradeLevel: 0, label: 'Too short', audience: 'Write more to calculate' },
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
      ...checkConfusedWords(text),
      ...checkRunOnSentences(text),
      ...checkSentenceFragments(text),
    ];
  }

  // Always run our heuristic checks for non-grammar categories
  const issues: WritingIssue[] = [
    ...grammarIssues,
    // Clarity
    ...checkSentenceLength(text),
    ...checkPassiveVoice(text),
    ...checkWeakWords(text),
    ...checkWordRepetition(text),
    ...checkCliches(text),
    ...checkHedgingLanguage(text),
    ...checkSentenceVariety(text),
    ...checkVagueOpeners(text),
    // Structure
    ...checkParagraphLength(text),
    ...checkTransitions(text),
    ...checkIntroConclusion(text),
    ...checkRepeatedParagraphOpeners(text),
    // Argument
    ...checkUnsupportedClaims(text),
    ...checkQuestionableStatements(text),
    ...checkPersonalOpinionOveruse(text),
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
    readability: calculateReadability(text),
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
      readability: { fleschReadingEase: 0, gradeLevel: 0, label: 'Too short', audience: 'Write more to calculate' },
      issues: [],
      checklist: generateChecklist('', []),
      fixFirst: [],
      thenPolish: [],
      categoryCounts: { grammar: 0, clarity: 0, structure: 0, argument: 0 },
    };
  }

  // Collect all issues
  const issues: WritingIssue[] = [
    // Grammar
    ...checkSpelling(text),
    ...checkPunctuation(text),
    ...checkConfusedWords(text),
    ...checkRunOnSentences(text),
    ...checkSentenceFragments(text),
    // Clarity
    ...checkSentenceLength(text),
    ...checkPassiveVoice(text),
    ...checkWeakWords(text),
    ...checkWordRepetition(text),
    ...checkCliches(text),
    ...checkHedgingLanguage(text),
    ...checkSentenceVariety(text),
    ...checkVagueOpeners(text),
    // Structure
    ...checkParagraphLength(text),
    ...checkTransitions(text),
    ...checkIntroConclusion(text),
    ...checkRepeatedParagraphOpeners(text),
    // Argument
    ...checkUnsupportedClaims(text),
    ...checkQuestionableStatements(text),
    ...checkPersonalOpinionOveruse(text),
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
    readability: calculateReadability(text),
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
  const fillerReplacements: Array<{ from: RegExp; to: string; label: string }> = [
    { from: /\b(very|really|extremely|incredibly)\s+/gi, to: '', label: 'Removed intensifier' },
    { from: /\b(just|simply|merely)\s+/gi, to: '', label: 'Removed filler' },
    { from: /\b(basically|essentially|fundamentally)\s+/gi, to: '', label: 'Removed filler' },
    { from: /\b(actually|literally|virtually)\s+/gi, to: '', label: 'Removed filler' },
    { from: /\bin order to\b/gi, to: 'to', label: 'Shortened "in order to" → "to"' },
    { from: /\bdue to the fact that\b/gi, to: 'because', label: 'Shortened "due to the fact that" → "because"' },
    { from: /\bin spite of the fact that\b/gi, to: 'although', label: 'Shortened phrase → "although"' },
    { from: /\bat this point in time\b/gi, to: 'now', label: 'Shortened "at this point in time" → "now"' },
    { from: /\bfor the purpose of\b/gi, to: 'to', label: 'Shortened "for the purpose of" → "to"' },
    { from: /\bin the event that\b/gi, to: 'if', label: 'Shortened "in the event that" → "if"' },
    { from: /\bit is important to note that\s*/gi, to: '', label: 'Removed throat-clearing' },
    { from: /\bit should be noted that\s*/gi, to: '', label: 'Removed throat-clearing' },
    { from: /\bit is worth mentioning that\s*/gi, to: '', label: 'Removed throat-clearing' },
    { from: /\bthe fact that\s+/gi, to: '', label: 'Removed "the fact that"' },
  ];

  for (const { from, to, label } of fillerReplacements) {
    const replaced = simplified.replace(from, to);
    if (replaced !== simplified) {
      changes.push(label);
      simplified = replaced;
    }
  }

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
    const replaced = simplified.replace(from, to);
    if (replaced !== simplified) {
      changes.push(label);
      simplified = replaced;
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
