export interface AssistResponse {
  mode: 'explain' | 'examples' | 'outline';
  selectionType: 'TERM' | 'SNIPPET';
  summary: string;
  bullets?: string[];
  examples?: string[];
  outline?: string[];
  followUpQuestion: string;
  reasoningNotes?: string;
}
