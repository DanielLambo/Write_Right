import React from 'react';
import { AnalysisResult, CoachTab, WritingIssue, IssueCategory } from '../types';

interface InsightsPanelProps {
  activeTab: CoachTab;
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  onTabChange: (tab: CoachTab) => void;
  onAnalyze: () => void;
  onIssueClick: (issue: WritingIssue) => void;
}

const TAB_CONFIG: { id: CoachTab; label: string; icon: string }[] = [
  { id: 'grammar', label: 'Mechanics', icon: '◇' },
  { id: 'clarity', label: 'Clarity', icon: '○' },
  { id: 'structure', label: 'Flow', icon: '≡' },
  { id: 'argument', label: 'Argument', icon: '△' },
  { id: 'checklist', label: 'Checklist', icon: '☐' },
];

const SEVERITY_MAP: Record<string, { label: string; color: string }> = {
  error: { label: 'Needs attention', color: '#c53030' },
  warning: { label: 'Consider revising', color: '#c05621' },
  suggestion: { label: 'Optional refinement', color: '#718096' },
};

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  activeTab,
  analysis,
  loading,
  error,
  onTabChange,
  onAnalyze,
  onIssueClick,
}) => {
  const filteredIssues = analysis?.issues.filter(
    issue => activeTab === 'checklist' || issue.category === activeTab
  ) || [];

  const getCategoryCount = (category: IssueCategory) => {
    return analysis?.categoryCounts[category] || 0;
  };

  const totalSignals = analysis
    ? Object.values(analysis.categoryCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <div className="insights-title">
          <h2>Revision Insights</h2>
          <button 
            className="analyze-btn" 
            onClick={onAnalyze} 
            disabled={loading}
          >
            {loading ? 'Scanning...' : 'Analyze Draft'}
          </button>
        </div>
        <nav className="insights-tabs">
          {TAB_CONFIG.map(tab => {
            const count = tab.id !== 'checklist' ? getCategoryCount(tab.id as IssueCategory) : null;
            return (
              <button
                key={tab.id}
                className={`insights-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {count !== null && count > 0 && (
                  <span className="tab-count">{count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="insights-content">
        {loading && (
          <div className="state-loading">
            <div className="spinner" />
            <p>Scanning your draft...</p>
          </div>
        )}

        {error && (
          <div className="state-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && !analysis && (
          <div className="state-empty">
            <div className="empty-icon">✎</div>
            <h3>Your writing, refined</h3>
            <p>
              Begin your draft in the editor. When ready, analyze to surface 
              clarity, structure, and argument signals.
            </p>
            <p className="empty-hint">
              Press <kbd>⌘</kbd><kbd>↵</kbd> to analyze
            </p>
          </div>
        )}

        {!loading && !error && analysis && activeTab === 'checklist' && (
          <div className="checklist-view">
            <div className="quality-card">
              <div className="quality-score">{analysis.qualityScore}</div>
              <div className="quality-label">Draft Quality</div>
              <div className="quality-meta">
                {totalSignals} {totalSignals === 1 ? 'signal' : 'signals'} detected
              </div>
            </div>
            <ul className="checklist">
              {analysis.checklist.map(item => (
                <li key={item.id} className={`checklist-item ${item.checked ? 'met' : 'unmet'}`}>
                  <span className="check-marker">{item.checked ? '✓' : '○'}</span>
                  <div className="check-body">
                    <span className="check-label">{item.label}</span>
                    <span className="check-detail">{item.tip}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && !error && analysis && activeTab !== 'checklist' && (
          <div className="signals-view">
            {filteredIssues.length === 0 ? (
              <div className="state-clear">
                <div className="clear-icon">✓</div>
                <p>No signals in this category.</p>
                <p className="clear-hint">Your draft looks strong here.</p>
              </div>
            ) : (
              <ul className="signals-list">
                {filteredIssues.map(issue => (
                  <li
                    key={issue.id}
                    className={`signal-item severity-${issue.severity}`}
                    onClick={() => onIssueClick(issue)}
                  >
                    <div className="signal-header">
                      <span 
                        className="signal-severity"
                        style={{ color: SEVERITY_MAP[issue.severity].color }}
                      >
                        {SEVERITY_MAP[issue.severity].label}
                      </span>
                    </div>
                    <h4 className="signal-title">{issue.title}</h4>
                    <blockquote className="signal-excerpt">"{issue.excerpt}"</blockquote>
                    <p className="signal-description">{issue.description}</p>
                    <div className="signal-guidance">
                      <strong>Revision guidance:</strong> {issue.howToFix}
                    </div>
                    {issue.microSuggestion && (
                      <div className="signal-suggestion">
                        <span className="suggestion-label">Consider:</span>
                        <code>{issue.microSuggestion}</code>
                      </div>
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
};

export default InsightsPanel;
