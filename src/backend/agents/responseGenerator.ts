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
type SentenceType = 'cause' | 'contrast' | 'definition' | 'example' | 'comparison' | 'list' | 'general';

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

function pickBestSentence(selection: string, context: string): string | undefined {
  const sentences = context
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return undefined;
  const selLower = selection.toLowerCase().trim();
  if (!selLower) return sentences[0];
  let best = sentences[0];
  let bestScore = -1;
  for (const s of sentences) {
    const lower = s.toLowerCase();
    const contains = lower.includes(selLower) ? 2 : 0;
    const overlap = selLower
      .split(/\s+/)
      .filter(Boolean)
      .reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    const score = contains + overlap - Math.abs(s.length - selection.length) / 200;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

function shortenSentence(sentence: string, maxChars = 160): string {
  if (sentence.length <= maxChars) return sentence;
  return `${sentence.slice(0, maxChars).trim()}...`;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickVariant<T>(items: T[], seed: string): T {
  if (items.length === 0) {
    throw new Error('pickVariant called with empty array');
  }
  const index = hashString(seed) % items.length;
  return items[index];
}

function buildDefinition(selection: string): string {
  const termKey = selection.trim().toLowerCase();
  const known = KNOWN_TERMS[termKey];
  if (known) return known.definition;
  return `"${selection}" is a key term that needs a clear definition in your essay.`;
}

function buildWhyItMatters(selection: string, contextSentence?: string): string {
  if (contextSentence) {
    return `It matters here because it connects to this nearby sentence: "${shortenSentence(contextSentence)}".`;
  }
  return `It matters here because it anchors a key idea the reader must understand before your argument makes sense.`;
}

function buildAnalogy(selection: string): string {
  const termKey = selection.trim().toLowerCase();
  const known = KNOWN_TERMS[termKey];
  if (known) return known.analogy;
  return `Think of it like a label that lets you refer back to the same idea without re-explaining it every time.`;
}

function extractKeyPhrases(sentence: string, max = 3): string[] {
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'so',
    'in', 'on', 'at', 'for', 'to', 'of', 'with', 'by', 'as',
    'is', 'are', 'was', 'were', 'be', 'being', 'been',
    'this', 'that', 'these', 'those', 'it', 'its', 'their', 'they',
    'i', 'you', 'he', 'she', 'we', 'us', 'them', 'your', 'our',
  ]);
  const words = sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !stopwords.has(w) && w.length > 3);
  const counts = new Map<string, number>();
  words.forEach(w => counts.set(w, (counts.get(w) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

function detectSentenceType(sentence: string): SentenceType {
  const s = sentence.toLowerCase();
  if (s.includes('because ') || s.includes('since ') || s.includes('as a result') || s.includes('therefore')) {
    return 'cause';
  }
  if (s.includes('however') || s.includes('but ') || s.includes('although') || s.includes('on the other hand')) {
    return 'contrast';
  }
  if (s.includes(' is ') || s.includes(' are ') || s.includes(' means ') || s.includes(' refers to ')) {
    return 'definition';
  }
  if (s.includes('for example') || s.includes('for instance') || s.includes('such as')) {
    return 'example';
  }
  if (s.includes('more than') || s.includes('less than') || s.includes('compared to') || s.includes('versus')) {
    return 'comparison';
  }
  if (s.includes(':') || s.includes('including') || s.includes('such as')) {
    return 'list';
  }
  return 'general';
}

function splitOnFirst(sentence: string, marker: string): [string, string] {
  const idx = sentence.toLowerCase().indexOf(marker);
  if (idx === -1) return [sentence, ''];
  return [sentence.slice(0, idx).trim(), sentence.slice(idx + marker.length).trim()];
}

function buildSnippetSummary(sentence: string, selection: string): string {
  const keyPhrases = extractKeyPhrases(sentence, 3);
  const anchor = keyPhrases.length > 0 ? keyPhrases.join(', ') : selection.trim();
  const type = detectSentenceType(sentence);
  const lower = sentence.toLowerCase();

  if (type === 'cause') {
    const [before, after] = lower.includes('because ')
      ? splitOnFirst(sentence, 'because ')
      : lower.includes('since ')
      ? splitOnFirst(sentence, 'since ')
      : [sentence, ''];
    const cause = after || anchor;
    return `This sentence links a cause to an effect: ${shortenSentence(before)} because ${shortenSentence(cause)}.`;
  }
  if (type === 'contrast') {
    return `This sentence sets up a contrast or tension, signaling a shift in your argument around ${anchor}.`;
  }
  if (type === 'definition') {
    return `This sentence is defining or clarifying ${anchor}.`;
  }
  if (type === 'example') {
    return `This sentence introduces an example to ground ${anchor}.`;
  }
  if (type === 'comparison') {
    return `This sentence compares two ideas, helping the reader judge ${anchor}.`;
  }
  if (type === 'list') {
    return `This sentence lists components or examples tied to ${anchor}.`;
  }

  const templates = [
    `In simpler words, this sentence is pointing to ${anchor}.`,
    `Plainly put, the idea here centers on ${anchor}.`,
    `This line is basically explaining ${anchor} in your argument.`,
    `The main takeaway is about ${anchor}, which drives the paragraph forward.`,
  ];
  return pickVariant(templates, sentence + selection);
}

function buildTypeSpecificGuidance(sentenceType: SentenceType, seed: string): string {
  const causeTips = [
    'Make sure the cause and effect are both clear—don’t leave the reader guessing which is which.',
    'Add a concrete example or evidence that supports the causal link.',
    'If the cause is complex, break it into two shorter sentences.',
  ];
  const contrastTips = [
    'Make the two sides of the contrast explicit so the reader sees the difference immediately.',
    'Clarify which side you agree with or which one is stronger.',
    'Use a transition word to emphasize the pivot in your argument.',
  ];
  const definitionTips = [
    'Keep the definition short and precise; save commentary for the next sentence.',
    'Make sure this definition appears before the term is used elsewhere.',
    'Avoid stacking multiple definitions in the same line.',
  ];
  const exampleTips = [
    'Name a specific example (person, event, study, or data point).',
    'Explain how the example supports your claim in the next sentence.',
    'If the example is generic, make it more concrete.',
  ];
  const comparisonTips = [
    'State the comparison axis (what exactly is being compared).',
    'Make the contrast measurable or observable, not just implied.',
    'Follow up with a reason why the comparison matters.',
  ];
  const listTips = [
    'Use a short lead-in so the reader knows why the list matters.',
    'Keep items parallel in structure for clarity.',
    'Limit the list to the most relevant points.',
  ];
  const generalTips = [
    'Make sure this sentence clearly supports the paragraph’s main point.',
    'Trim extra phrases so the key idea lands quickly.',
    'Check that the sentence before sets it up and the sentence after builds on it.',
  ];

  const pick = (arr: string[]) => pickVariant(arr, seed);
  switch (sentenceType) {
    case 'cause':
      return pick(causeTips);
    case 'contrast':
      return pick(contrastTips);
    case 'definition':
      return pick(definitionTips);
    case 'example':
      return pick(exampleTips);
    case 'comparison':
      return pick(comparisonTips);
    case 'list':
      return pick(listTips);
    default:
      return pick(generalTips);
  }
}

function buildSnippetRoleGuidance(role: ContentRole, writingTone: WritingTone, seed: string): string {
  const claimTips = [
    'Because this reads like a claim, it should be followed by evidence or an example.',
    'This sounds like a position—add a concrete detail or citation to make it believable.',
    'Claims work best with proof; consider a fact, statistic, or brief example right after.',
  ];
  const defTips = [
    'Because this reads like a definition, keep it concise and make sure it appears before the term is used later.',
    'If this is defining something, tighten it to one clean sentence and move on.',
    'Definitions should be short and clear—avoid adding extra claims here.',
  ];
  const exTips = [
    'Because this reads like an example, make sure it directly supports the point you just made.',
    'Examples should be specific—name a real case, event, or observation.',
    'If this is an example, connect it back to the claim in the next sentence.',
  ];
  const otherTips = [
    'Make sure this sentence clearly supports the paragraph’s main point.',
    'Check that the sentence before sets it up and the sentence after follows through.',
    'If this is a transition, make the connection explicit.',
  ];

  const tonePrefix =
    writingTone === 'argumentative'
      ? 'This appears in an argumentative section, so clarity and evidence matter most. '
      : writingTone === 'explanatory'
      ? 'This sits in an explanatory section, so clarity and definitions matter most. '
      : '';

  const tip =
    role === 'claim'
      ? pickVariant(claimTips, seed)
      : role === 'definition'
      ? pickVariant(defTips, seed)
      : role === 'example'
      ? pickVariant(exTips, seed)
      : pickVariant(otherTips, seed);

  return `${tonePrefix}${tip}`;
}

function buildSnippetBullets(role: ContentRole, seed: string): string[] {
  const common = [
    'State the core point in one line. If you can’t, the sentence is doing too much.',
    'Trim extra phrases so the main idea lands quickly.',
  ];
  const claim = [
    'Add a concrete detail, stat, or example if this is your main claim.',
    'Follow this with evidence so it doesn’t feel like an unsupported opinion.',
  ];
  const definition = [
    'Keep the definition tight—one sentence is enough.',
    'Move additional background info to the next sentence.',
  ];
  const example = [
    'Make the example specific (who, what, when).',
    'Connect the example back to your claim in the next line.',
  ];
  const other = [
    'Check that the sentence before sets it up and the sentence after builds on it.',
  ];

  const roleBullets =
    role === 'claim'
      ? claim
      : role === 'definition'
      ? definition
      : role === 'example'
      ? example
      : other;

  const result = [
    pickVariant(common, seed),
    pickVariant(roleBullets, seed + 'role'),
    pickVariant([...common, ...roleBullets], seed + 'mix'),
  ];

  return Array.from(new Set(result));
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

  const bestSentence = pickBestSentence(selection, context);
  const nearbyRef = bestSentence
    ? `Closest sentence: "${shortenSentence(bestSentence)}".`
    : 'No nearby sentence was found; try expanding the selection.';

  if (type === 'TERM') {
    const definition = buildDefinition(selection);
    const why = buildWhyItMatters(selection, bestSentence);
    const analogy = buildAnalogy(selection);

    return {
      mode: 'explain',
      selectionType: 'TERM',
      summary: `${definition} ${why} ${analogy}`,
      bullets: [
        'Add a brief definition the first time you use it (one sentence is enough).',
        'Connect the term directly to your overall claim or research question.',
        'Include one concrete detail (location, function, impact, or why it matters).'
      ],
      followUpQuestion: `In one sentence, how would you define "${selection}" for a friend outside this class?`,
      reasoningNotes: `Classified as TERM because the selection is short and lacks sentence punctuation. Detected ${writingTone} tone and ${role} role, so the response focuses on defining the term, tying it to nearby context, and keeping it aligned with the essay’s argument. ${nearbyRef}`
    };
  } else {
    const simplified = bestSentence
      ? buildSnippetSummary(bestSentence, selection)
      : buildSnippetSummary(selection, selection);

    const sentenceType = detectSentenceType(bestSentence ?? selection);
    const typeGuidance = buildTypeSpecificGuidance(sentenceType, selection + context);
    const roleGuidance = buildSnippetRoleGuidance(role, writingTone, selection + context);

    return {
      mode: 'explain',
      selectionType: 'SNIPPET',
      summary: `${simplified} ${typeGuidance} ${roleGuidance}`,
      bullets: buildSnippetBullets(role, selection + context),
      followUpQuestion: 'If you had to rewrite this sentence in 10–12 words, what would you keep?',
      reasoningNotes: `Classified as SNIPPET because the selection is longer or sentence-like. Detected ${writingTone} tone, ${role} role, and ${sentenceType} sentence type, so the response paraphrases the closest full sentence and gives targeted advice for that structure. ${nearbyRef}`
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
