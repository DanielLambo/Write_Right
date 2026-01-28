export type IssueSeverity = 'error' | 'warning' | 'suggestion';
export type IssueCategory = 'grammar' | 'clarity' | 'structure' | 'argument';
export type CoachTab = 'grammar' | 'clarity' | 'structure' | 'argument' | 'checklist';

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
  checked: boolean;
  tip: string;
}

export interface AnalysisResult {
  qualityScore: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  issues: WritingIssue[];
  checklist: ChecklistItem[];
  categoryCounts: Record<IssueCategory, number>;
}
