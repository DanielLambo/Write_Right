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
  { id: 'overview', label: 'Overview' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'clarity', label: 'Clarity' },
  { id: 'structure', label: 'Structure' },
  { id: 'argument', label: 'Argument' },
  { id: 'checklist', label: 'Submit' },
];

const STATUS_ICONS = {
  pass: '✓',
  warning: '⚠',
  fail: '✗',
};

export default function InsightsPanel({ activeTab, analysis, loading, error, onTabChange, onIssueClick }: Props) {
  const issues = analysis?.issues.filter(i => 
    activeTab === 'overview' || activeTab === 'checklist' || i.category === activeTab
  ) || [];
  
  const getCount = (cat: IssueCategory) => analysis?.categoryCounts[cat] || 0;
  const totalIssues = analysis ? Object.values(analysis.categoryCounts).reduce((a, b) => a + b, 0) : 0;

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
            {tab.id !== 'overview' && tab.id !== 'checklist' && analysis && getCount(tab.id as IssueCategory) > 0 && (
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

        {/* OVERVIEW TAB - Priority-based */}
        {!loading && !error && analysis && activeTab === 'overview' && (
          <div className="overview-view">
            <div className="score-header">
              <div className="score">{analysis.qualityScore}<span>/100</span></div>
              <div className="score-label">Draft Quality</div>
            </div>

            {analysis.fixFirst.length > 0 && (
              <div className="priority-section fix-first">
                <h3>🔴 Fix these first</h3>
                <ul>
                  {analysis.fixFirst.map((item, i) => (
                    <li key={i} onClick={() => onTabChange(item.category as CoachTab)}>
                      <span className="priority-label">{item.label}</span>
                      {item.count && <span className="priority-count">{item.count}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.thenPolish.length > 0 && (
              <div className="priority-section then-polish">
                <h3>🟡 Then polish</h3>
                <ul>
                  {analysis.thenPolish.map((item, i) => (
                    <li key={i} onClick={() => onTabChange(item.category as CoachTab)}>
                      <span className="priority-label">{item.label}</span>
                      {item.count && <span className="priority-count">{item.count}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.fixFirst.length === 0 && analysis.thenPolish.length === 0 && (
              <div className="all-good">
                <span className="all-good-icon">✓</span>
                <p>Looking good! No major issues found.</p>
              </div>
            )}

            {totalIssues > 0 && (
              <div className="issue-summary">
                <p>{totalIssues} total issue{totalIssues !== 1 ? 's' : ''} found</p>
              </div>
            )}
          </div>
        )}

        {/* CHECKLIST TAB - Before You Submit */}
        {!loading && !error && analysis && activeTab === 'checklist' && (
          <div className="checklist-view">
            <h3>📋 Before You Submit</h3>
            <p className="checklist-subtitle">Your final review checklist</p>
            
            <ul className="checklist">
              {analysis.checklist.map(item => (
                <li key={item.id} className={`checklist-item ${item.status}`}>
                  <span className={`status-icon ${item.status}`}>
                    {STATUS_ICONS[item.status]}
                  </span>
                  <div className="checklist-content">
                    <span className="checklist-label">{item.label}</span>
                    <span className="checklist-detail">{item.detail}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="checklist-footer">
              <p className="integrity-note">
                ✍️ This checklist helps you review your own work.<br/>
                <strong>Write-Right never writes for you.</strong>
              </p>
            </div>
          </div>
        )}

        {/* CATEGORY TABS - Issue lists */}
        {!loading && !error && analysis && !['overview', 'checklist'].includes(activeTab) && (
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
