export type IssueSeverity = 'error' | 'warning' | 'suggestion';
export type IssueCategory = 'grammar' | 'clarity' | 'structure' | 'argument';
export type CoachTab = 'overview' | 'grammar' | 'clarity' | 'structure' | 'argument' | 'checklist';
export type CheckStatus = 'pass' | 'warning' | 'fail';

export interface WritingIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  howToFix: string;
  microSuggestion?: string;
  startIndex: number;
  endIndex: number;
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
  qualityScore: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  issues: WritingIssue[];
  checklist: ChecklistItem[];
  fixFirst: PriorityItem[];
  thenPolish: PriorityItem[];
  categoryCounts: Record<IssueCategory, number>;
}
