import React from 'react';
import { AnalysisResult, CoachTab, WritingIssue, IssueCategory } from '../types';

interface Props {
  activeTab: CoachTab;
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  onTabChange: (tab: CoachTab) => void;
  onIssueClick: (issue: WritingIssue) => void;
}

const TABS: { id: CoachTab; label: string }[] = [
  { id: 'grammar', label: 'Grammar' },
  { id: 'clarity', label: 'Clarity' },
  { id: 'structure', label: 'Structure' },
  { id: 'argument', label: 'Argument' },
  { id: 'checklist', label: 'Checklist' },
];

export default function InsightsPanel({ activeTab, analysis, loading, error, onTabChange, onIssueClick }: Props) {
  const issues = analysis?.issues.filter(i => activeTab === 'checklist' || i.category === activeTab) || [];
  const getCount = (cat: IssueCategory) => analysis?.categoryCounts[cat] || 0;

  return (
    <div className="insights-panel">
      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
            {tab.id !== 'checklist' && analysis && getCount(tab.id as IssueCategory) > 0 && (
              <span className="count">{getCount(tab.id as IssueCategory)}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="content">
        {loading && <div className="state">Analyzing...</div>}
        {error && <div className="state error">{error}</div>}
        
        {!loading && !error && !analysis && (
          <div className="state empty">
            <p>Write something and click <strong>Analyze</strong></p>
            <p className="hint">or press <kbd>⌘</kbd><kbd>↵</kbd></p>
          </div>
        )}

        {!loading && !error && analysis && activeTab === 'checklist' && (
          <div className="checklist-view">
            <div className="score">{analysis.qualityScore}<span>/100</span></div>
            <ul className="checklist">
              {analysis.checklist.map(item => (
                <li key={item.id} className={item.checked ? 'done' : ''}>
                  <span className="icon">{item.checked ? '✓' : '○'}</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && !error && analysis && activeTab !== 'checklist' && (
          <div className="issues-view">
            {issues.length === 0 ? (
              <div className="state">No issues here ✓</div>
            ) : (
              <ul className="issues">
                {issues.map(issue => (
                  <li 
                    key={issue.id} 
                    className={`issue ${issue.severity}`}
                    onClick={() => onIssueClick(issue)}
                  >
                    <div className="issue-title">{issue.title}</div>
                    <div className="issue-excerpt">"{issue.excerpt}"</div>
                    <div className="issue-desc">{issue.description}</div>
                    <div className="issue-fix"><strong>Fix:</strong> {issue.howToFix}</div>
                    {issue.microSuggestion && (
                      <div className="issue-suggestion">→ {issue.microSuggestion}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
