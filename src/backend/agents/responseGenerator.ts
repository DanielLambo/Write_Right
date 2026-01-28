/**
 * Deterministic response generator for MVP.
 * Structured as a tiny "agent" pipeline:
 *  - context extraction
 *  - intent / role detection
 *  - response assembly
 * This makes it easy to swap in an LLM later.
 */

export type AssistMode = 'explain' | 'examples' | 'outline';
export type SelectionType = 'TERM' | 'SNIPPET';
type WritingTone = 'argumentative' | 'explanatory' | 'mixed';
type ContentRole = 'claim' | 'definition' | 'example' | 'other';

type GlossaryEntry = {
  definition: string;
  whyItMatters: string;
  analogy: string;
};

// Tiny offline glossary for common student terms (keep small + extensible).
const KNOWN_TERMS: Record<string, GlossaryEntry> = {
  cervix: {
    definition:
      'The cervix is the lower, narrow part of the uterus that opens into the vagina.',
    whyItMatters:
      'It matters because it plays a key role in reproduction and pregnancy (it can stay closed during pregnancy and dilate during childbirth).',
    analogy:
      'Think of it like a doorway between the uterus and the vagina that can open or close depending on what the body needs.',
  },
};

export interface AssistResponse {
  mode: AssistMode;
  selectionType: SelectionType;
  summary: string;
  bullets?: string[];
  examples?: string[];
  outline?: string[];
  followUpQuestion: string;
  /**
   * Brief explanation of why the agent classified the selection as it did
   * and why it chose this style of response.
   */
  reasoningNotes: string;
}

/**
 * Extract a context window around the selection.
 * Keeps things deterministic and offline.
 */
export function extractContext(
  essayText: string,
  selectionStart: number,
  selectionEnd: number,
  windowSize = 250
): string {
  const beforeStart = Math.max(0, selectionStart - windowSize);
  const afterEnd = Math.min(essayText.length, selectionEnd + windowSize);
  return essayText.substring(beforeStart, afterEnd);
}

/**
 * Classify selection type based on heuristics.
 * TERM: short, no period. Otherwise SNIPPET.
 */
function classifySelection(selection: string): SelectionType {
  const words = selection.trim().split(/\s+/).filter(Boolean);
  const hasPeriod = selection.includes('.');

  if (words.length <= 5 && !hasPeriod) {
    return 'TERM';
  }
  return 'SNIPPET';
}

/**
 * Very lightweight heuristics to detect writing tone.
 * Looks for argumentative vs explanatory markers in nearby context.
 */
function detectWritingTone(context: string): WritingTone {
  const lower = context.toLowerCase();
  const argumentativeMarkers = ['therefore', 'however', 'because', 'thus', 'on the other hand'];
  const explanatoryMarkers = ['for example', 'for instance', 'in other words', 'that is'];

  const hasArg = argumentativeMarkers.some(m => lower.includes(m));
  const hasExpl = explanatoryMarkers.some(m => lower.includes(m));

  if (hasArg && hasExpl) return 'mixed';
  if (hasArg) return 'argumentative';
  if (hasExpl) return 'explanatory';
  return 'mixed';
}

/**
 * Heuristic content role classification:
 * - claim: looks like a statement taking a position
 * - definition: "is", "refers to", "is defined as"
 * - example: "for example", "for instance"
 */
function detectContentRole(selection: string, context: string): ContentRole {
  const lowerSel = selection.toLowerCase();
  const lowerCtx = context.toLowerCase();

  if (lowerSel.includes(' for example') || lowerSel.includes(' for instance') || lowerCtx.includes('for example')) {
    return 'example';
  }

  if (
    lowerSel.includes(' is ') ||
    lowerSel.includes(' refers to ') ||
    lowerSel.includes(' is defined as ')
  ) {
    return 'definition';
  }

  // crude "claim" detector: first-person + modal verbs or strong verbs
  if (
    /\b(i (argue|believe|contend|claim|think))\b/.test(lowerSel) ||
    /\b(should|must|need to|have to)\b/.test(lowerSel)
  ) {
    return 'claim';
  }

  return 'other';
}

/**
 * Extract nearby sentences so responses can reference them explicitly.
 */
function extractNearbySentences(context: string): { before?: string; after?: string } {
  const sentences = context
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return {};
  // Use first as "before" and last as "after" as a simple proxy.
  if (sentences.length === 1) return { before: sentences[0] };
  return {
    before: sentences[0],
    after: sentences[sentences.length - 1],
  };
}

/**
 * Naive keyword extraction used as "lightweight semantic grounding".
 * Frequency + position weighting, no ML libraries.
 */
function extractKeyTerms(essayText: string, maxTerms = 5): string[] {
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'so',
    'in', 'on', 'at', 'for', 'to', 'of', 'with', 'by', 'as',
    'is', 'are', 'was', 'were', 'be', 'being', 'been',
    'this', 'that', 'these', 'those', 'it', 'its', 'their', 'they',
    'i', 'you', 'he', 'she', 'we', 'us', 'them'
  ]);

  const words = essayText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const scores = new Map<string, number>();

  words.forEach((word, idx) => {
    if (stopwords.has(word) || word.length <= 3) return;
    const base = scores.get(word) ?? 0;
    // Basic frequency + position weighting (earlier terms slightly higher)
    const positionWeight = 1 + (words.length - idx) / words.length;
    scores.set(word, base + positionWeight);
  });

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([term]) => term);
}

/**
 * Generate response based on mode and selection type.
 * This is the "agent" entry point.
 */
export function generateResponse(
  mode: AssistMode,
  selection: string,
  essayText: string,
  selectionStart: number,
  selectionEnd: number
): AssistResponse {
  const selectionType = classifySelection(selection);
  const context = extractContext(essayText, selectionStart, selectionEnd);
  const writingTone = detectWritingTone(context);
  const contentRole = detectContentRole(selection, context);
  const nearbySentences = extractNearbySentences(context);
  const keyTerms = extractKeyTerms(essayText);

  switch (mode) {
    case 'explain':
      return generateExplainResponse(selection, selectionType, context, writingTone, contentRole, nearbySentences);
    case 'examples':
      return generateExamplesResponse(selection, selectionType, contentRole, keyTerms);
    case 'outline':
      return generateOutlineResponse(essayText, keyTerms);
    default:
      throw new Error(`Unknown mode: ${mode}`);
  }
}

function generateExplainResponse(
  selection: string,
  type: SelectionType,
  context: string,
  writingTone: WritingTone,
  role: ContentRole,
  nearby: { before?: string; after?: string }
): AssistResponse {
  const toneHint =
    writingTone === 'argumentative'
      ? 'This appears in a more argumentative part of your paragraph, where you are pushing a claim or comparison.'
      : writingTone === 'explanatory'
      ? 'This sits inside an explanatory passage, where you clarify ideas or give background.'
      : 'This sits in a mixed passage that blends explanation with argument.';

  const roleHint =
    role === 'definition'
      ? 'Here it functions mostly as a definition, helping the reader understand a key term.'
      : role === 'example'
      ? 'Here it behaves like an example that grounds your point in something concrete.'
      : role === 'claim'
      ? 'Here it reads like a claim or position you are taking.'
      : 'Here it works as supporting detail around your main ideas.';

  const nearbyRef = nearby.before
    ? `It is surrounded by sentences like: "${nearby.before}${nearby.after ? ' ... ' + nearby.after : ''}", which shape how a reader interprets it.`
    : 'Looking at the nearby sentences helps clarify how a reader will understand it.';

  if (type === 'TERM') {
    const termKey = selection.trim().toLowerCase();
    const known = KNOWN_TERMS[termKey];
    const definition = known?.definition ?? `"${selection}" is a key term in this passage.`;
    const why = known?.whyItMatters ?? 'It matters here because it anchors what your reader should understand before the rest of the point makes sense.';
    const analogy = known?.analogy ?? 'A quick analogy: treat it like a “label” for an idea—once defined, everything else can build on it.';

    return {
      mode: 'explain',
      selectionType: 'TERM',
      summary: `${definition} ${why} ${analogy}`,
      bullets: [
        'Add a brief definition the first time you use it (one sentence is enough).',
        'Connect the term directly to your overall claim or research question.',
        'If this is a biology/anatomy term, consider adding one concrete detail (location, function, or why it’s relevant).'
      ],
      followUpQuestion: `In one sentence, how would you define "${selection}" for a friend outside this class?`,
      reasoningNotes: `Classified as TERM because the selection is short and lacks sentence punctuation. Detected ${writingTone} tone and ${role} role, so the response focuses on clarifying the concept, tying it to your argument, and encouraging you to use nearby sentences for definition. ${nearbyRef}`
    };
  } else {
    return {
      mode: 'explain',
      selectionType: 'SNIPPET',
      summary: `In simpler terms, this part is saying that ${selection.trim()} It guides the reader toward how you want them to think about your topic.`,
      bullets: [
        'Check that the main point of this sentence can be stated in one clear, direct line.',
        'Make sure the sentence before it sets up the idea, and the sentence after it follows through.',
        'If this is a claim, consider adding a concrete example or piece of evidence nearby.'
      ],
      followUpQuestion: 'If you had to rewrite this sentence in 10–12 words, what would you keep?',
      reasoningNotes: `Classified as SNIPPET because the selection is longer or sentence-like. Detected ${writingTone} tone and ${role} role, so the response paraphrases the idea, highlights how it functions in the argument, and suggests tightening or supporting it using the surrounding context. ${nearbyRef}`
    };
  }
}

function generateExamplesResponse(
  selection: string,
  type: SelectionType,
  role: ContentRole,
  keyTerms: string[]
): AssistResponse {
  const anchor = keyTerms[0] || selection;
  const roleLabel =
    role === 'definition'
      ? 'definition you gave'
      : role === 'claim'
      ? 'claim you are making'
      : role === 'example'
      ? 'example you mentioned'
      : 'idea in this sentence';

  return {
    mode: 'examples',
    selectionType: type,
    summary: `Here are a couple of examples that connect to the ${roleLabel} around "${selection}".`,
    examples: [
      `Academic example: In a course essay, a writer might introduce "${anchor}" while comparing two theories, then use a study or paper to illustrate how it plays out in practice.`,
      `Real-world example: Outside the classroom, you might see "${anchor}" show up in news articles, social media discussions, or everyday decisions people make—use one of those situations to ground your point.`
    ],
    followUpQuestion: 'Which of these directions feels closer to your assignment, and can you adapt one into a concrete example?',
    reasoningNotes: `Used examples mode, so the response focuses on one academic-style and one real-world-style illustration. The agent picked "${anchor}" as a key term from your essay to keep the examples tied to your actual topic, and tailored the wording to match the detected role (${role}).`
  };
}

function generateOutlineResponse(essayText: string, keyTerms: string[]): AssistResponse {
  // Simple heuristic: split by paragraphs and create outline points
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const outline: string[] = [];

  const mainTerm = keyTerms[0];
  const termHint = mainTerm ? ` (anchored on "${mainTerm}")` : '';

  if (paragraphs.length === 0) {
    outline.push(`Introduction: Establish your main argument${termHint}`);
    outline.push('Body paragraph 1: Present your first supporting point with evidence');
    outline.push('Body paragraph 2: Develop a contrasting or deepening point');
    outline.push('Body paragraph 3: Address a counterargument or complexity');
    outline.push('Conclusion: Synthesize your points and return to the big picture');
  } else {
    outline.push(`Introduction${termHint}: ${paragraphs[0]?.substring(0, 60)}...`);
    paragraphs.slice(1, -1).forEach((para, idx) => {
      outline.push(`Body ${idx + 1}: ${para.substring(0, 60)}...`);
    });
    if (paragraphs.length > 1) {
      outline.push(`Conclusion: ${paragraphs[paragraphs.length - 1]?.substring(0, 60)}...`);
    }
  }

  return {
    mode: 'outline',
    selectionType: 'SNIPPET',
    summary: `Based on your current draft, here's a possible structure that keeps your main ideas organized${termHint ? ' around a recurring theme' : ''}.`,
    outline: outline.length > 0
      ? outline
      : [
          'Introduction: Hook and thesis',
          'Body paragraph 1: Main point with evidence',
          'Body paragraph 2: Supporting or contrasting point',
          'Body paragraph 3: Additional perspective or counterargument',
          'Conclusion: Summary and final thought'
        ],
    followUpQuestion: 'Looking at this outline, which section feels underdeveloped or missing entirely?',
    reasoningNotes: `Generated an outline because the mode was outline. The agent scanned the essay for recurring key terms${mainTerm ? ` and found "${mainTerm}" as a central term` : ''}, then used paragraph boundaries to propose a simple introduction–body–conclusion structure that you can refine.`
  };
}

/**
 * Placeholder for future LLM integration
 * TODO: Replace deterministic logic with actual LLM call
 */
export async function generateWithProvider(
  mode: AssistMode,
  selection: string,
  context: string,
  essayText: string,
  provider: 'openai' | 'anthropic' | 'local' = 'openai'
): Promise<AssistResponse> {
  // For MVP, fall back to deterministic generator
  // Later: implement actual API calls here
  // We do not have selectionStart/selectionEnd here, so approximate by searching.
  const index = essayText.indexOf(selection);
  const start = index >= 0 ? index : 0;
  const end = start + selection.length;
  return generateResponse(mode, selection, essayText, start, end);
}
