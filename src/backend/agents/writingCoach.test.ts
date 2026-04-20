import { describe, it, expect } from 'vitest';
import { analyzeEssay, simplifySentence, stripQuotedText, stemWord } from './writingCoach';

// ============================================================================
// ANALYSIS ENGINE TESTS
// ============================================================================

describe('analyzeEssay', () => {
  it('returns empty result for empty text', () => {
    const result = analyzeEssay('');
    expect(result.qualityScore).toBe(0);
    expect(result.issues).toHaveLength(0);
    expect(result.wordCount).toBe(0);
  });

  it('returns empty result for whitespace-only text', () => {
    const result = analyzeEssay('   \n\n  ');
    expect(result.qualityScore).toBe(0);
    expect(result.issues).toHaveLength(0);
  });

  it('counts words, sentences, and paragraphs correctly', () => {
    const text = 'This is the first paragraph. It has two sentences.\n\nThis is the second paragraph. It also has two sentences.';
    const result = analyzeEssay(text);
    expect(result.wordCount).toBe(19);
    expect(result.sentenceCount).toBe(4);
    expect(result.paragraphCount).toBe(2);
  });

  it('calculates reading time', () => {
    // 200 words = 1 min
    const words = Array(200).fill('word').join(' ') + '.';
    const result = analyzeEssay(words);
    expect(result.readingTimeMinutes).toBe(1);
  });

  // --- GRAMMAR ---

  it('detects common misspellings', () => {
    const result = analyzeEssay('I recieve teh letter and adn read it carefully every day so that I can learn more about things.');
    const spellingIssues = result.issues.filter(i => i.title === 'Possible spelling error');
    expect(spellingIssues.length).toBeGreaterThanOrEqual(3);
  });

  it('detects double spaces', () => {
    const result = analyzeEssay('This has  double spaces in the sentence and more words to fill the requirement for analysis to work.');
    const spaceIssues = result.issues.filter(i => i.title === 'Extra spaces');
    expect(spaceIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('detects missing capitalization at sentence start', () => {
    const result = analyzeEssay('First sentence is fine. second sentence is not capitalized. Third is okay again and this makes it long enough.');
    const capIssues = result.issues.filter(i => i.title === 'Capitalize first word');
    expect(capIssues.length).toBeGreaterThanOrEqual(1);
  });

  // --- CLARITY ---

  it('detects very long sentences (>40 words)', () => {
    const longSentence = 'This is a very long sentence that goes on and on and on without stopping because the writer did not know when to end the sentence and just kept adding more and more words to it until it became really difficult to read.';
    const result = analyzeEssay(longSentence);
    const longIssues = result.issues.filter(i => i.title === 'Very long sentence');
    expect(longIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('detects passive voice', () => {
    const result = analyzeEssay('The ball was kicked by the boy. The letter was written by the student. The cake was eaten quickly by all of the hungry children at the party.');
    const passiveIssues = result.issues.filter(i => i.title === 'Passive voice detected');
    expect(passiveIssues.length).toBeGreaterThanOrEqual(2);
  });

  it('detects improved passive voice patterns (could be, should be)', () => {
    const result = analyzeEssay('The policy could be improved by the committee. The project should be completed by next month according to the detailed schedule.');
    const passiveIssues = result.issues.filter(i => i.title === 'Passive voice detected');
    expect(passiveIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('detects weak/filler words', () => {
    const result = analyzeEssay('I actually really just basically wanted to say that very literally things are stuff that matter in the world today.');
    const weakIssues = result.issues.filter(i => i.title === 'Weak or filler word');
    expect(weakIssues.length).toBeGreaterThanOrEqual(4);
  });

  it('detects word repetition in consecutive sentences', () => {
    const result = analyzeEssay('The education system needs reform in many different areas. The education system has failed students in those same areas for many long years.');
    const repIssues = result.issues.filter(i => i.title === 'Word repetition');
    expect(repIssues.length).toBeGreaterThanOrEqual(1);
  });

  // --- STRUCTURE ---

  it('detects missing transitions in body paragraphs', () => {
    const text = `This essay will discuss important topics in this field of study.

The first point is about climate change and its effects on our daily lives and communities around the world.

The second point discusses economic factors that influence policy decisions and government spending priorities.

In conclusion, these factors together shape our understanding of the modern world and its complexities.`;
    const result = analyzeEssay(text);
    const transIssues = result.issues.filter(i => i.title === 'Consider adding a transition');
    expect(transIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('detects weak introduction (no thesis indicator)', () => {
    const text = `There are many things to think about in the modern world today and yesterday and many more things ahead for all of us to consider deeply.

Some people feel strongly about environmental issues and want to protect the natural world around them. They join organizations and advocate for change in their communities. This is a growing movement across all nations of the world. People care more now than ever before about the environment. They organize protests and campaigns to raise awareness about climate change and pollution.

Others care more about economic growth and creating new jobs for the working population. They focus on business development and supporting local enterprises. The economy drives much of the policy discussion in governments everywhere. Many nations prioritize trade agreements and industrial growth. Investment in infrastructure creates opportunity for all citizens. Some economists suggest that growth and sustainability can work together in harmony.

Meanwhile, education plays a vital role in shaping how people think about these issues from a young age. Schools can teach children about the environment while also preparing them for the workforce. Teachers have a responsibility to present balanced perspectives on these complex topics to their students.

In conclusion, both perspectives have merit and should be considered carefully when making decisions about the future of our society and the communities within it.`;
    const result = analyzeEssay(text);
    expect(result.wordCount).toBeGreaterThanOrEqual(200);
    expect(result.paragraphCount).toBeGreaterThanOrEqual(3);
    const introIssues = result.issues.filter(i => i.title === 'Introduction could be stronger');
    expect(introIssues.length).toBeGreaterThanOrEqual(1);
  });

  // --- ARGUMENT ---

  it('detects unsupported claims', () => {
    const result = analyzeEssay('Everyone should exercise daily. It is the best way to stay healthy. You must take care of yourself properly and be more mindful.');
    const claimIssues = result.issues.filter(i => i.title === 'Claim may need support');
    expect(claimIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('does not flag supported claims', () => {
    const result = analyzeEssay('Everyone should exercise daily because research shows it reduces heart disease risk by thirty percent according to medical experts.');
    const claimIssues = result.issues.filter(i => i.title === 'Claim may need support');
    expect(claimIssues.length).toBe(0);
  });

  it('detects absolute statements', () => {
    const result = analyzeEssay('Everyone knows that education is important for all children in the modern world of today and tomorrow.');
    const absIssues = result.issues.filter(i => i.title === 'Questionable absolute statement');
    expect(absIssues.length).toBeGreaterThanOrEqual(1);
  });

  // --- QUALITY SCORE ---

  it('scores clean text highly', () => {
    const text = `I believe that renewable energy is essential for our future.

Solar power has become increasingly affordable. For example, the cost of solar panels has dropped by seventy percent since 2010. This trend suggests widespread adoption is feasible.

Furthermore, wind energy provides another viable alternative. According to recent studies, wind farms now generate enough electricity to power millions of homes across the country.

However, challenges remain in energy storage technology. Battery capacity must improve before renewables can fully replace fossil fuels in all applications.

In conclusion, investing in renewable energy today will yield significant environmental and economic benefits for future generations.`;
    const result = analyzeEssay(text);
    expect(result.qualityScore).toBeGreaterThanOrEqual(60);
  });

  it('scores text with many issues lower', () => {
    const text = 'teh recieve seperate definately untill wierd  thier. just really very basically actually literally things stuff.';
    const result = analyzeEssay(text);
    expect(result.qualityScore).toBeLessThan(50);
  });

  // --- READABILITY ---

  it('calculates readability for sufficient text', () => {
    const text = 'The cat sat on the mat. The dog ran in the park. Birds fly in the sky. Fish swim in the sea. Children play in the sun.';
    const result = analyzeEssay(text);
    expect(result.readability.fleschReadingEase).toBeGreaterThan(0);
    expect(result.readability.gradeLevel).toBeGreaterThan(0);
    expect(result.readability.label).not.toBe('Too short');
  });

  it('returns "Too short" readability for very short text', () => {
    const result = analyzeEssay('Hello world.');
    expect(result.readability.label).toBe('Too short');
  });

  it('gives easy readability for simple sentences', () => {
    const text = 'The cat sat on the mat. The dog ran fast. It was a nice day. The sun was out. We played all day.';
    const result = analyzeEssay(text);
    expect(result.readability.fleschReadingEase).toBeGreaterThanOrEqual(60);
  });

  // --- CHECKLIST ---

  it('generates a checklist', () => {
    const text = `I believe that education is crucial for the development of society and all its members.

Schools provide foundational knowledge and essential skills that students need in their adult lives.

Furthermore, higher education opens doors to better career opportunities and greater financial stability.

In conclusion, investing in education benefits both individuals and the broader community significantly.`;
    const result = analyzeEssay(text);
    expect(result.checklist.length).toBeGreaterThan(0);
    expect(result.checklist.some(c => c.id === 'thesis')).toBe(true);
    expect(result.checklist.some(c => c.id === 'grammar')).toBe(true);
  });

  // --- NEW GRAMMAR CHECKS ---

  it('detects confused words (your/you\'re)', () => {
    const result = analyzeEssay('Your going to love this new approach to writing essays. Your welcome to use it anytime you want today.');
    const confused = result.issues.filter(i => i.title === 'Commonly confused word');
    expect(confused.length).toBeGreaterThanOrEqual(1);
  });

  it('detects "would of" error', () => {
    const result = analyzeEssay('I would of gone to the store if I had known about the sale happening today at the local market.');
    const confused = result.issues.filter(i => i.title === 'Commonly confused word');
    expect(confused.length).toBeGreaterThanOrEqual(1);
  });

  it('detects run-on sentences (comma splices)', () => {
    const result = analyzeEssay('The students studied hard for the exam, They wanted to get good grades and pass the difficult course this semester.');
    const runOns = result.issues.filter(i => i.title.includes('run-on'));
    expect(runOns.length).toBeGreaterThanOrEqual(1);
  });

  // --- NEW CLARITY CHECKS ---

  it('detects cliches', () => {
    const result = analyzeEssay('At the end of the day it goes without saying that we need to think outside the box to find solutions.');
    const cliches = result.issues.filter(i => i.title === 'Cliche detected');
    expect(cliches.length).toBeGreaterThanOrEqual(2);
  });

  it('detects hedging language', () => {
    const result = analyzeEssay('I think that education matters. In my opinion it is kind of sort of important for all children in the world.');
    const hedging = result.issues.filter(i => i.title === 'Hedging language');
    expect(hedging.length).toBeGreaterThanOrEqual(2);
  });

  it('detects repetitive sentence starts', () => {
    const result = analyzeEssay('Students need better resources. Students deserve good teachers. Students want to learn new things. Students are the future of our nation. Students require our attention and support.');
    const variety = result.issues.filter(i => i.title === 'Repetitive sentence starts');
    expect(variety.length).toBeGreaterThanOrEqual(1);
  });

  it('detects weak sentence openers (There is/It is)', () => {
    const result = analyzeEssay('There are many reasons to study hard every day. It is important to note that education has changed. There is evidence everywhere.');
    const vague = result.issues.filter(i => i.title === 'Weak sentence opener');
    expect(vague.length).toBeGreaterThanOrEqual(1);
  });

  // --- NEW STRUCTURE CHECKS ---

  it('detects repeated paragraph openings', () => {
    const text = `The first point is about education and its role in modern society.

The first point is also about technology and how it shapes our daily lives.

The first point is furthermore about the economy and its growth in recent years.`;
    const result = analyzeEssay(text);
    const repeated = result.issues.filter(i => i.title === 'Repeated paragraph opening');
    expect(repeated.length).toBeGreaterThanOrEqual(1);
  });

  // --- NEW ARGUMENT CHECKS ---

  it('detects expanded absolute statements', () => {
    const result = analyzeEssay('It is well known that the earth is round. Common sense tells us this is correct and everyone should understand.');
    const absolutes = result.issues.filter(i => i.title === 'Questionable absolute statement');
    expect(absolutes.length).toBeGreaterThanOrEqual(1);
  });

  it('detects personal opinion overuse', () => {
    const result = analyzeEssay('I think education is great. I believe schools are good. I feel teachers matter. I think learning helps. Personally I think we need more schools. I believe this is true for all students.');
    const opinion = result.issues.filter(i => i.title.includes('Over-reliance'));
    expect(opinion.length).toBeGreaterThanOrEqual(1);
  });

  // --- IMPROVED CHECKLIST ---

  it('checklist includes sentence variety and readability checks', () => {
    const text = `I believe that renewable energy is essential for our future.

Solar power has become increasingly affordable. For example, the cost of solar panels has dropped significantly. This trend suggests widespread adoption is feasible.

Furthermore, wind energy provides another viable alternative. According to recent studies, wind farms now generate enough electricity to power millions of homes.

In conclusion, investing in renewable energy today will yield significant benefits for future generations.`;
    const result = analyzeEssay(text);
    expect(result.checklist.some(c => c.id === 'variety')).toBe(true);
    expect(result.checklist.some(c => c.id === 'readability')).toBe(true);
  });

  // --- PRIORITIES ---

  it('generates fix-first and then-polish priorities', () => {
    const text = `There are many things to consider about this topic today.

Education is always the best solution. Everyone must agree with this point. It is clearly obvious.

In the end we should just basically think about things very carefully and really consider all the stuff.`;
    const result = analyzeEssay(text);
    expect(result.fixFirst.length + result.thenPolish.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// SIMPLIFY SENTENCE TESTS
// ============================================================================

describe('simplifySentence', () => {
  it('returns original for clean sentences', () => {
    const result = simplifySentence('The project succeeded.');
    expect(result.simplified).toBe('The project succeeded.');
    expect(result.changes[0]).toContain('No simplifications');
  });

  it('removes intensifiers (very, really)', () => {
    const result = simplifySentence('The project was very really important.');
    expect(result.simplified).not.toContain('very');
    expect(result.simplified).not.toContain('really');
    expect(result.changes.length).toBeGreaterThan(0);
  });

  it('removes filler words (just, basically, actually)', () => {
    const result = simplifySentence('I just basically actually wanted to go home.');
    expect(result.simplified).not.toContain('just');
    expect(result.simplified).not.toContain('basically');
    expect(result.simplified).not.toContain('actually');
  });

  it('shortens "in order to" to "to"', () => {
    const result = simplifySentence('We study in order to learn new things.');
    expect(result.simplified).toContain('to learn');
    expect(result.simplified).not.toContain('in order to');
  });

  it('shortens "due to the fact that" to "because"', () => {
    const result = simplifySentence('We left early due to the fact that it was raining.');
    expect(result.simplified).toContain('because');
    expect(result.simplified).not.toContain('due to the fact that');
  });

  it('replaces wordy constructions', () => {
    const result = simplifySentence('She is able to make a decision quickly.');
    expect(result.simplified).toContain('can');
    expect(result.simplified).toContain('decide');
  });

  it('rejects text over 50 words', () => {
    const longText = Array(60).fill('word').join(' ');
    const result = simplifySentence(longText);
    expect(result.changes[0]).toContain('too long');
  });

  it('preserves capitalization after simplification', () => {
    const result = simplifySentence('Very important things need attention.');
    expect(result.simplified[0]).toMatch(/[A-Z]/);
  });

  it('handles empty input', () => {
    const result = simplifySentence('');
    expect(result.simplified).toBe('');
  });
});

// ============================================================================
// QUOTE GUARD TESTS
// ============================================================================

describe('stripQuotedText', () => {
  it('strips double-quoted text preserving positions', () => {
    const result = stripQuotedText('He said "hello world" to her.');
    expect(result).not.toContain('hello world');
    expect(result.length).toBe('He said "hello world" to her.'.length);
  });

  it('strips curly-quoted text', () => {
    const result = stripQuotedText('She wrote \u201Cgoodbye\u201D in the letter.');
    expect(result).not.toContain('goodbye');
  });

  it('does not flag issues inside quotes', () => {
    // "very" inside quotes should be ignored by weak word check
    const text = 'The author wrote "I was very happy" in the opening. The rest of the story was well-structured and compelling to read today.';
    const result = analyzeEssay(text);
    const weakInQuotes = result.issues.filter(i => i.title === 'Weak or filler word' && i.excerpt === 'very');
    expect(weakInQuotes.length).toBe(0);
  });
});

// ============================================================================
// STEMMER TESTS
// ============================================================================

describe('stemWord', () => {
  it('stems common suffixes', () => {
    expect(stemWord('development')).toBe(stemWord('develop'));
    expect(stemWord('developed')).toBe(stemWord('develop'));
    expect(stemWord('developing')).toBe(stemWord('develop'));
  });

  it('stems -ness and -ment suffixes', () => {
    expect(stemWord('darkness')).toBe('dark');
    expect(stemWord('agreement')).toBe(stemWord('agree'));
  });

  it('handles double-consonant normalization', () => {
    expect(stemWord('running')).toBe(stemWord('runs'));
    expect(stemWord('stopped')).toBe(stemWord('stops'));
    expect(stemWord('planned')).toBe(stemWord('plans'));
    expect(stemWord('bigger')).toBe('big');
    expect(stemWord('sitting')).toBe(stemWord('sits'));
  });

  it('returns short words unchanged', () => {
    expect(stemWord('cat')).toBe('cat');
    expect(stemWord('go')).toBe('go');
  });

  it('catches repetition via stemming in analysis', () => {
    const text = 'The development of new technology is exciting. Developers create exciting new tools every single day.';
    const result = analyzeEssay(text);
    const repIssues = result.issues.filter(i => i.title === 'Word repetition');
    // "development" and "developers" share the stem "develop"
    expect(repIssues.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// REVERSE OUTLINE TESTS (route logic inline)
// ============================================================================

describe('reverse outline logic', () => {
  function buildReverseOutline(text: string) {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    return paragraphs.map((para, i) => {
      const sentences = para.match(/[^.!?]*[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 0) || [];
      const sentenceCount = sentences.length;
      const firstSentence = sentences[0] || para.substring(0, 80);
      const lastSentence = sentenceCount > 1 ? sentences[sentenceCount - 1] : firstSentence;
      return { index: i + 1, firstSentence, lastSentence, sentenceCount, isRisk: sentenceCount <= 1 };
    });
  }

  it('extracts first and last sentences', () => {
    const text = 'First sentence here. Middle stuff. Last sentence here.\n\nAnother paragraph starts. It ends here.';
    const outline = buildReverseOutline(text);
    expect(outline).toHaveLength(2);
    expect(outline[0].firstSentence).toContain('First sentence');
    expect(outline[0].lastSentence).toContain('Last sentence');
  });

  it('flags single-sentence paragraphs as risk', () => {
    const text = 'This is a full paragraph with multiple sentences. It develops an idea.\n\nThis is alone.\n\nAnother full paragraph with details. And more here.';
    const outline = buildReverseOutline(text);
    expect(outline[1].isRisk).toBe(true);
    expect(outline[0].isRisk).toBe(false);
  });

  it('handles single paragraph', () => {
    const text = 'Just one paragraph with two sentences. Here is the second.';
    const outline = buildReverseOutline(text);
    expect(outline).toHaveLength(1);
    expect(outline[0].sentenceCount).toBe(2);
  });
});
