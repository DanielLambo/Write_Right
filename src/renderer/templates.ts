import { WritingTemplate, TemplateCategoryInfo } from './types';

export const TEMPLATE_CATEGORIES: TemplateCategoryInfo[] = [
  { id: 'academic', label: 'Academic', icon: '\u{1F4DA}' },
  { id: 'professional', label: 'Professional', icon: '\u{1F4BC}' },
  { id: 'creative', label: 'Creative', icon: '\u{2728}' },
  { id: 'general', label: 'General', icon: '\u{1F4DD}' },
];

export const TEMPLATES: WritingTemplate[] = [
  // =========================================================================
  // ACADEMIC
  // =========================================================================
  {
    id: 'argumentative-essay',
    name: 'Argumentative Essay',
    category: 'academic',
    description: 'Build a thesis and defend it with evidence',
    icon: '\u{2696}\u{FE0F}',
    content: `Argumentative Essay

INTRODUCTION
[Hook: Open with a compelling fact, question, or scenario that draws the reader in]

[Background: Provide 2-3 sentences of context on the topic]

Thesis: [State your central argument clearly in one sentence]


BODY PARAGRAPH 1 - Strongest Argument
Topic sentence: [State your first and strongest supporting point]

Evidence: [Cite a specific source, statistic, or example]

Analysis: [Explain how this evidence supports your thesis]

[Transition to next point]


BODY PARAGRAPH 2 - Supporting Argument
Topic sentence: [State your second supporting point]

Evidence: [Cite a specific source, statistic, or example]

Analysis: [Explain how this evidence supports your thesis]

[Transition to next point]


BODY PARAGRAPH 3 - Counterargument & Rebuttal
Counterargument: [Acknowledge the strongest opposing viewpoint]

Rebuttal: [Explain why your position is still stronger]

Evidence: [Support your rebuttal with evidence]


CONCLUSION
[Restate your thesis in new words]

[Summarize your key arguments]

[End with a call to action, broader implication, or thought-provoking closing]`,
  },
  {
    id: 'persuasive-essay',
    name: 'Persuasive Essay',
    category: 'academic',
    description: 'Convince the reader to adopt your viewpoint',
    icon: '\u{1F4E3}',
    content: `Persuasive Essay

INTRODUCTION
[Hook: Start with an emotional appeal, surprising statistic, or vivid scenario]

[Establish why this topic matters to the reader personally]

Thesis: [State what you want the reader to believe or do]


WHY THIS MATTERS
[Explain the stakes - what happens if nothing changes?]

[Use emotional or ethical appeal to connect with the reader]


REASON 1
[State your most compelling reason]

[Provide evidence: facts, expert opinions, or real-world examples]

[Explain how this directly affects the reader or community]


REASON 2
[State your second reason]

[Provide evidence: facts, expert opinions, or real-world examples]

[Connect back to your main argument]


REASON 3
[State your third reason]

[Provide evidence: facts, expert opinions, or real-world examples]


ADDRESSING DOUBTS
[What might skeptics say? Acknowledge their concern fairly]

[Respond with evidence and reasoning]


CALL TO ACTION
[Restate your position with conviction]

[Tell the reader exactly what they should think, do, or support]

[End with a memorable closing line]`,
  },
  {
    id: 'compare-contrast',
    name: 'Compare & Contrast',
    category: 'academic',
    description: 'Analyze similarities and differences between two subjects',
    icon: '\u{1F500}',
    content: `Compare & Contrast Essay

INTRODUCTION
[Introduce Subject A and Subject B]

[Explain why comparing these two is meaningful or interesting]

Thesis: [State the key insight that emerges from comparing them]


SIMILARITIES
[Similarity 1: Describe how both subjects share this trait]

[Similarity 2: Describe another shared characteristic]

[Similarity 3: Describe a third commonality, if applicable]


DIFFERENCES
[Difference 1: How Subject A and Subject B diverge on this point]

[Difference 2: Another area of contrast]

[Difference 3: A third distinction, if applicable]


ANALYSIS
[Which similarities or differences are most significant? Why?]

[What does this comparison reveal that looking at each alone would not?]


CONCLUSION
[Restate your thesis about the comparison]

[Reflect on what the reader should take away from this analysis]`,
  },
  {
    id: 'expository-essay',
    name: 'Expository Essay',
    category: 'academic',
    description: 'Explain a topic clearly and objectively',
    icon: '\u{1F4A1}',
    content: `Expository Essay

INTRODUCTION
[Hook: Present an interesting fact or question about your topic]

[Provide brief background context]

Thesis: [State the main idea you will explain]


SECTION 1
[Topic sentence: Introduce the first aspect of your explanation]

[Facts and details that explain this point]

[Example or illustration]


SECTION 2
[Topic sentence: Introduce the second aspect]

[Facts and details that explain this point]

[Example or illustration]


SECTION 3
[Topic sentence: Introduce the third aspect]

[Facts and details that explain this point]

[Example or illustration]


CONCLUSION
[Restate the main idea]

[Summarize the key points you explained]

[Leave the reader with a final thought or wider context]`,
  },
  {
    id: 'research-paper',
    name: 'Research Paper',
    category: 'academic',
    description: 'Present original research with sources and analysis',
    icon: '\u{1F52C}',
    content: `Research Paper

TITLE
[Your research paper title]

ABSTRACT
[Summarize your research question, method, key findings, and conclusion in 150-250 words]


INTRODUCTION
[Introduce the topic and its significance]

[Review relevant background and existing research]

Research question: [State the specific question your paper addresses]

Thesis: [State your central argument or hypothesis]


LITERATURE REVIEW
[Source 1: Summarize findings and relevance to your question]

[Source 2: Summarize findings and relevance]

[Source 3: Summarize findings and relevance]

[Identify gaps in existing research that your paper addresses]


METHODOLOGY
[Describe your research approach]

[Explain your sources and how you selected them]


ANALYSIS / FINDINGS
[Present your key finding or argument 1 with evidence]

[Present your key finding or argument 2 with evidence]

[Present your key finding or argument 3 with evidence]


DISCUSSION
[Interpret your findings - what do they mean?]

[How do they relate to existing research?]

[Acknowledge limitations of your research]


CONCLUSION
[Restate your research question and thesis]

[Summarize your main findings]

[Suggest directions for future research]


WORKS CITED
[List your sources in the required citation format]`,
  },
  {
    id: 'literary-analysis',
    name: 'Literary Analysis',
    category: 'academic',
    description: 'Interpret and analyze a work of literature',
    icon: '\u{1F4D6}',
    content: `Literary Analysis

INTRODUCTION
[Name the work, author, and publication date]

[Provide brief context about the work]

Thesis: [State your interpretive argument about the text]


ANALYSIS POINT 1
[Topic sentence: State your first analytical claim]

Evidence: [Quote or describe a specific passage from the text]

Analysis: [Explain how this passage supports your interpretation]


ANALYSIS POINT 2
[Topic sentence: State your second analytical claim]

Evidence: [Quote or describe a specific passage from the text]

Analysis: [Explain how this passage supports your interpretation]


ANALYSIS POINT 3
[Topic sentence: State your third analytical claim]

Evidence: [Quote or describe a specific passage from the text]

Analysis: [Explain how this passage supports your interpretation]


CONCLUSION
[Restate your thesis in light of the evidence presented]

[Explain the broader significance of your interpretation]

[How does this analysis deepen our understanding of the work?]`,
  },
  {
    id: 'lab-report',
    name: 'Lab Report',
    category: 'academic',
    description: 'Document an experiment with methods and results',
    icon: '\u{1F9EA}',
    content: `Lab Report

TITLE
[Experiment title]

PURPOSE
[State the objective of this experiment]

[What question are you trying to answer?]


HYPOTHESIS
[State your prediction and the reasoning behind it]


MATERIALS
[List all materials and equipment used]


PROCEDURE
[Step 1: Describe what you did]

[Step 2: Describe the next action]

[Step 3: Continue listing steps]

[Include any safety precautions taken]


DATA / OBSERVATIONS
[Record your raw data - measurements, observations, readings]

[Include tables or descriptions of what you observed]


ANALYSIS
[What patterns or trends do you see in the data?]

[Perform any required calculations]

[Create or describe any graphs]


CONCLUSION
[Was your hypothesis supported or refuted? Explain with evidence]

[What sources of error might have affected your results?]

[What would you do differently? What further experiments would you suggest?]`,
  },
  {
    id: 'book-report',
    name: 'Book Report',
    category: 'academic',
    description: 'Summarize and respond to a book',
    icon: '\u{1F4D5}',
    content: `Book Report

BOOK INFORMATION
Title: [Book title]
Author: [Author name]
Genre: [Genre]
Pages: [Page count]


INTRODUCTION
[Introduce the book and why you chose it or why it is significant]


SUMMARY
[Describe the setting - when and where does the story take place?]

[Introduce the main characters and their key traits]

[Summarize the plot without giving away the ending]

[What is the central conflict or problem?]


KEY THEMES
[Theme 1: Identify a major theme and explain how the author develops it]

[Theme 2: Identify another theme with supporting details]


YOUR RESPONSE
[What did you find most interesting or surprising?]

[Did any character or event resonate with you personally? Why?]

[What is the author's message or purpose?]


RECOMMENDATION
[Would you recommend this book? For what kind of reader?]

[Rate and give your final thoughts]`,
  },
  {
    id: 'annotated-bibliography',
    name: 'Annotated Bibliography',
    category: 'academic',
    description: 'Summarize and evaluate your research sources',
    icon: '\u{1F4CB}',
    content: `Annotated Bibliography

TOPIC
[State your research topic or question]


SOURCE 1
Citation: [Full citation in required format]
Summary: [What is this source about? Summarize the main argument or findings in 2-3 sentences]
Evaluation: [Is this source credible? What are its strengths and weaknesses?]
Relevance: [How does this source relate to your research question?]


SOURCE 2
Citation: [Full citation in required format]
Summary: [Summarize the main argument or findings in 2-3 sentences]
Evaluation: [Is this source credible? Strengths and weaknesses?]
Relevance: [How does this relate to your research?]


SOURCE 3
Citation: [Full citation in required format]
Summary: [Summarize the main argument or findings in 2-3 sentences]
Evaluation: [Is this source credible? Strengths and weaknesses?]
Relevance: [How does this relate to your research?]


[Add more sources as needed following the same format]`,
  },

  // =========================================================================
  // PROFESSIONAL
  // =========================================================================
  {
    id: 'formal-email',
    name: 'Formal Email',
    category: 'professional',
    description: 'Professional email with clear purpose and tone',
    icon: '\u{1F4E7}',
    content: `Formal Email

TO: [Recipient name and title]
FROM: [Your name]
DATE: [Date]
SUBJECT: [Clear, specific subject line]


Dear [Recipient's name or title],

[Opening: State your purpose for writing in 1-2 sentences]

[Body: Provide the necessary details, context, or request]

[If applicable: List specific items, questions, or action items]

[Closing: State what you need from the recipient or the next steps]

[Professional sign-off],
[Your full name]
[Your title/role, if applicable]`,
  },
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    category: 'professional',
    description: 'Introduce yourself for a job application',
    icon: '\u{1F4C4}',
    content: `Cover Letter

[Your name]
[Your address]
[Your email]
[Date]

[Hiring manager name]
[Company name]
[Company address]


Dear [Hiring manager name or "Hiring Manager"],

OPENING
[State the position you are applying for and where you found it]

[One sentence about why you are excited about this role]


WHY I AM A STRONG FIT
[Connect your most relevant experience or skill to the job requirements]

[Provide a specific example or achievement that demonstrates your value]

[Mention another relevant qualification and tie it to what the company needs]


WHAT I ADMIRE ABOUT THIS ORGANIZATION
[Show you have researched the company - mention a specific project, value, or mission]

[Explain how your goals align with the company's direction]


CLOSING
[Restate your enthusiasm for the role]

[Mention that your resume is attached and you welcome the opportunity to discuss further]

Sincerely,
[Your full name]`,
  },
  {
    id: 'business-memo',
    name: 'Business Memo',
    category: 'professional',
    description: 'Internal communication with clear action items',
    icon: '\u{1F4CC}',
    content: `Business Memo

MEMORANDUM

TO: [Recipient(s)]
FROM: [Your name and title]
DATE: [Date]
RE: [Subject - be specific]


PURPOSE
[State the purpose of this memo in 1-2 sentences]


BACKGROUND
[Provide relevant context the reader needs to understand the situation]


KEY POINTS
[Point 1: State clearly and concisely]

[Point 2: State clearly and concisely]

[Point 3: State clearly and concisely]


ACTION REQUIRED
[What do you need the reader to do? By when?]

[Who is responsible for what?]

[Include any deadlines or next meeting dates]

Please contact me at [your contact info] with any questions.`,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    category: 'professional',
    description: 'Record discussions, decisions, and action items',
    icon: '\u{1F5D3}\u{FE0F}',
    content: `Meeting Notes

MEETING DETAILS
Date: [Date]
Time: [Start time - End time]
Location: [Room/platform]
Attendees: [List names]
Absent: [List names, if applicable]


AGENDA
[Topic 1]
[Topic 2]
[Topic 3]


DISCUSSION NOTES

[Topic 1]
[Summarize what was discussed]
[Key points raised by participants]
[Any decisions made]

[Topic 2]
[Summarize what was discussed]
[Key points raised by participants]
[Any decisions made]

[Topic 3]
[Summarize what was discussed]
[Key points raised by participants]
[Any decisions made]


ACTION ITEMS
[Action item 1] - Assigned to: [Name] - Due: [Date]
[Action item 2] - Assigned to: [Name] - Due: [Date]
[Action item 3] - Assigned to: [Name] - Due: [Date]


NEXT MEETING
Date: [Date]
Topics to follow up on: [List items]`,
  },
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    category: 'professional',
    description: 'Pitch a project with goals, timeline, and resources',
    icon: '\u{1F680}',
    content: `Project Proposal

PROJECT TITLE
[Your project name]

PREPARED BY
[Your name, role, date]


EXECUTIVE SUMMARY
[Summarize the project in 3-4 sentences: what, why, and expected outcome]


PROBLEM STATEMENT
[What problem does this project solve?]

[Who is affected and how?]

[Why is now the right time to address this?]


PROPOSED SOLUTION
[Describe your proposed approach]

[Key features or components of the solution]

[How does this address the problem stated above?]


GOALS AND OBJECTIVES
[Goal 1: Specific, measurable outcome]

[Goal 2: Specific, measurable outcome]

[Goal 3: Specific, measurable outcome]


TIMELINE
[Phase 1: Description and dates]

[Phase 2: Description and dates]

[Phase 3: Description and dates]


RESOURCES NEEDED
[Budget estimate, if applicable]

[Personnel or team requirements]

[Tools, technology, or materials needed]


EXPECTED OUTCOMES
[What does success look like?]

[How will you measure success?]


CONCLUSION
[Restate the value of this project and request approval or support]`,
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    category: 'professional',
    description: 'Concise overview of findings and recommendations',
    icon: '\u{1F4CA}',
    content: `Executive Summary

TITLE
[Document or project title]


OVERVIEW
[In 2-3 sentences, state what this document covers and why it matters]


KEY FINDINGS
[Finding 1: State concisely with supporting data]

[Finding 2: State concisely with supporting data]

[Finding 3: State concisely with supporting data]


RECOMMENDATIONS
[Recommendation 1: What should be done and why]

[Recommendation 2: What should be done and why]


NEXT STEPS
[Immediate action items with responsible parties]

[Timeline for implementation]


CONCLUSION
[Final statement summarizing the most important takeaway]`,
  },
  {
    id: 'recommendation-letter',
    name: 'Recommendation Letter',
    category: 'professional',
    description: 'Endorse someone for a role or opportunity',
    icon: '\u{1F31F}',
    content: `Recommendation Letter

[Your name]
[Your title/position]
[Your institution/organization]
[Date]

To Whom It May Concern,

INTRODUCTION
[State who you are recommending and for what (job, program, scholarship)]

[Explain your relationship to this person and how long you have known them]


CHARACTER AND QUALITIES
[Describe 1-2 key character traits with specific examples]

[What makes this person stand out from others you have worked with?]


SKILLS AND ACHIEVEMENTS
[Highlight a specific accomplishment or project]

[Describe relevant skills and how you have observed them in action]


SUITABILITY
[Why is this person well-suited for the specific opportunity?]

[How will they contribute to the organization or program?]


CLOSING
[Give your strongest endorsement]

[Offer to provide additional information if needed]

Sincerely,
[Your full name]
[Your title]
[Your contact information]`,
  },

  // =========================================================================
  // CREATIVE
  // =========================================================================
  {
    id: 'personal-narrative',
    name: 'Personal Narrative',
    category: 'creative',
    description: 'Tell a personal story with reflection',
    icon: '\u{1F4D3}',
    content: `Personal Narrative

OPENING SCENE
[Drop the reader into a specific moment - where are you? What is happening?]

[Use sensory details: what do you see, hear, feel?]


CONTEXT
[Provide the backstory the reader needs to understand this moment]

[Who are the key people involved?]


RISING ACTION
[What happened next? Build tension or curiosity]

[Include dialogue, specific details, and your thoughts at the time]


THE TURNING POINT
[Describe the key moment - the event, realization, or decision]

[Slow down here and give this moment the detail it deserves]


REFLECTION
[How did this experience change you?]

[What did you learn about yourself or the world?]


CLOSING
[Return to the present or look forward]

[End with an image, thought, or line that resonates]`,
  },
  {
    id: 'short-story-outline',
    name: 'Short Story Outline',
    category: 'creative',
    description: 'Plan your plot, characters, and structure',
    icon: '\u{1F3AC}',
    content: `Short Story Outline

CONCEPT
[One-sentence summary of your story]


CHARACTERS
Protagonist: [Name, key traits, what they want]
Antagonist/Obstacle: [What or who stands in the way]
Supporting characters: [Names and roles]


SETTING
[When and where does this story take place?]
[What is the mood or atmosphere?]


PLOT STRUCTURE

Act 1 - Setup
[Opening scene: How does the story begin?]
[Introduce the protagonist and their ordinary world]
[Inciting incident: What disrupts the normal?]

Act 2 - Confrontation
[Rising action: What challenges does the protagonist face?]
[How do the stakes escalate?]
[Midpoint: A key revelation or shift]
[Things get worse: What is the lowest point?]

Act 3 - Resolution
[Climax: The decisive confrontation or moment]
[Falling action: Immediate aftermath]
[Resolution: How does the story end? What has changed?]


THEMES
[What deeper idea does this story explore?]


NOTES
[Voice/tone you want to achieve]
[Any research needed]`,
  },
  {
    id: 'poetry-framework',
    name: 'Poetry Framework',
    category: 'creative',
    description: 'Structure your poem with imagery and form',
    icon: '\u{1F338}',
    content: `Poetry Framework

CONCEPT
[What is the poem about? What feeling or image is at its core?]


FORM
[What form will you use? Free verse, sonnet, haiku, villanelle, etc.]
[If structured: note the rhyme scheme, meter, or stanza pattern]


CENTRAL IMAGE OR METAPHOR
[What is the dominant image or metaphor that runs through the poem?]


STANZA 1 / OPENING
[What image, scene, or idea opens the poem?]

[Draft lines or notes here]


STANZA 2 / DEVELOPMENT
[How does the poem develop, deepen, or shift?]

[Draft lines or notes here]


STANZA 3 / TURN OR CLIMAX
[Where does the poem turn, surprise, or intensify?]

[Draft lines or notes here]


CLOSING LINES
[How does the poem end? What feeling should linger?]

[Draft lines or notes here]


SENSORY PALETTE
[List specific senses you want to invoke: sights, sounds, textures, smells, tastes]


WORD BANK
[Collect words and phrases that feel right for this poem]`,
  },
  {
    id: 'reflective-journal',
    name: 'Reflective Journal',
    category: 'creative',
    description: 'Process an experience through writing',
    icon: '\u{1F4DD}',
    content: `Reflective Journal

DATE: [Date]
TOPIC: [What experience, event, or idea are you reflecting on?]


WHAT HAPPENED
[Describe the experience or event factually]

[Who was involved? Where did it take place?]


WHAT I FELT
[What were your emotions during and after?]

[Were you surprised by any of your reactions?]


WHAT I LEARNED
[What insight did this give you?]

[Did it confirm or challenge something you believed?]


WHAT I WILL DO DIFFERENTLY
[How will this reflection influence your future actions or thinking?]

[Are there specific changes you want to make?]


CONNECTIONS
[Does this connect to anything else you have been learning or experiencing?]`,
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    category: 'creative',
    description: 'Engaging web article with a clear takeaway',
    icon: '\u{1F310}',
    content: `Blog Post

TITLE: [A catchy, specific title that promises value to the reader]

SUBTITLE: [Optional: A clarifying line beneath the title]


HOOK
[Open with a question, bold statement, anecdote, or surprising fact]

[Why should the reader care about this topic?]


THE MAIN POINT
[State your central idea or argument clearly]


SECTION 1: [Subheading]
[Explain your first point]

[Support it with an example, story, or data]


SECTION 2: [Subheading]
[Explain your second point]

[Support it with an example, story, or data]


SECTION 3: [Subheading]
[Explain your third point]

[Support it with an example, story, or data]


TAKEAWAY
[What is the one thing the reader should remember?]

[End with a question, call to action, or forward-looking thought]`,
  },

  // =========================================================================
  // GENERAL
  // =========================================================================
  {
    id: 'thank-you-note',
    name: 'Thank You Note',
    category: 'general',
    description: 'Express genuine gratitude',
    icon: '\u{1F64F}',
    content: `Thank You Note

Dear [Recipient's name],

[Express your gratitude specifically - what are you thanking them for?]

[Describe the impact - how did their action, gift, or support make a difference?]

[Add a personal touch - reference a shared memory or future plan]

[Close warmly],
[Your name]`,
  },
  {
    id: 'complaint-letter',
    name: 'Complaint Letter',
    category: 'general',
    description: 'Address a problem professionally and seek resolution',
    icon: '\u{270D}\u{FE0F}',
    content: `Complaint Letter

[Your name]
[Your address]
[Date]

[Recipient name or department]
[Organization name]
[Organization address]


Dear [Recipient or "To Whom It May Concern"],

PURPOSE
[State clearly what you are writing to complain about]

[Include relevant details: dates, order numbers, reference numbers]


WHAT HAPPENED
[Describe the problem factually and specifically]

[What did you expect to happen vs. what actually happened?]

[What steps have you already taken to resolve this?]


WHAT I AM REQUESTING
[State clearly what resolution you want: refund, replacement, apology, action]

[Include a reasonable deadline if appropriate]

I look forward to your response. I can be reached at [your contact information].

Sincerely,
[Your full name]`,
  },
  {
    id: 'opinion-piece',
    name: 'Opinion Piece',
    category: 'general',
    description: 'Share and defend your perspective on an issue',
    icon: '\u{1F4E2}',
    content: `Opinion Piece

HEADLINE: [A clear, strong headline that signals your position]


OPENING
[Start with a timely hook - a recent event, trend, or widely held belief]

[State your opinion clearly and directly]


WHY THIS MATTERS
[Explain the stakes - who is affected and how?]

[Why should readers care about this now?]


SUPPORTING ARGUMENT 1
[State your point]

[Back it up with evidence, examples, or expert perspective]


SUPPORTING ARGUMENT 2
[State your point]

[Back it up with evidence, examples, or expert perspective]


ANTICIPATING OBJECTIONS
[Acknowledge the most reasonable counterargument]

[Explain why your position holds despite this objection]


CLOSING
[Restate your opinion with force]

[End with a memorable line or call to reflection]`,
  },
  {
    id: 'speech-presentation',
    name: 'Speech / Presentation',
    category: 'general',
    description: 'Outline a talk with opening, points, and closing',
    icon: '\u{1F3A4}',
    content: `Speech / Presentation

TITLE: [Speech or presentation title]
AUDIENCE: [Who are you speaking to?]
DURATION: [Target length]


OPENING (10% of time)
[Attention grabber: story, question, startling fact, or bold statement]

[Establish credibility - why should the audience listen to you on this topic?]

[Preview: Tell the audience what you will cover]


MAIN POINT 1 (25% of time)
[State the point clearly]

[Support with evidence, story, or example]

[Transition to next point]


MAIN POINT 2 (25% of time)
[State the point clearly]

[Support with evidence, story, or example]

[Transition to next point]


MAIN POINT 3 (25% of time)
[State the point clearly]

[Support with evidence, story, or example]

[Transition to closing]


CLOSING (15% of time)
[Summarize your key points]

[Call to action or memorable closing statement]

[End strong - your last words should resonate]


NOTES
[Key phrases to remember]
[Audience questions to anticipate]`,
  },
];
