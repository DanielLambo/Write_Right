import React, { useState, useEffect } from 'react';
import { AnalysisResult, CoachTab, WritingIssue, IssueCategory, ReverseOutlineResult } from '../types';
import SentenceRhythm from './SentenceRhythm';
import { API_BASE, ENDPOINTS } from '../config';

interface Props {
  activeTab: CoachTab;
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  essayText: string;
  wpmWarning: boolean;
  fastTypist: boolean;
  onFastTypistToggle: () => void;
  onTabChange: (tab: CoachTab) => void;
  onIssueClick: (issue: WritingIssue) => void;
  onSentenceHover: (start: number, end: number) => void;
  onSentenceLeave: () => void;
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
  pass: '\u2713',
  warning: '\u26A0',
  fail: '\u2717',
};

export default function InsightsPanel({ activeTab, analysis, loading, error, essayText, wpmWarning, fastTypist, onFastTypistToggle, onTabChange, onIssueClick, onSentenceHover, onSentenceLeave }: Props) {
  const [reverseOutline, setReverseOutline] = useState<ReverseOutlineResult | null>(null);

  const issues = analysis?.issues.filter(i =>
    activeTab === 'overview' || activeTab === 'checklist' || i.category === activeTab
  ) || [];

  const getCount = (cat: IssueCategory) => analysis?.categoryCounts[cat] || 0;
  const totalIssues = analysis ? Object.values(analysis.categoryCounts).reduce((a, b) => a + b, 0) : 0;

  // Fetch reverse outline when structure tab is active
  useEffect(() => {
    if (activeTab === 'structure' && essayText.trim().length > 50) {
      fetch(`${API_BASE}${ENDPOINTS.reverseOutline}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essayText }),
      })
        .then(r => r.json())
        .then(data => setReverseOutline(data))
        .catch(() => setReverseOutline(null));
    }
  }, [activeTab, essayText]);

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
        {loading && <div className="state loading-pulse">Analyzing your writing...</div>}
        {error && <div className="state error">{error}</div>}

        {!loading && !error && !analysis && (
          <div className="state empty">
            <p>Write something and click <strong>Analyze</strong></p>
            <p className="hint">or press <kbd>{'\u2318'}</kbd><kbd>{'\u21B5'}</kbd></p>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {!loading && !error && analysis && activeTab === 'overview' && (
          <div className="overview-view">
            <div className="score-header">
              <div className={`score ${analysis.qualityScore >= 80 ? 'score-great' : analysis.qualityScore >= 60 ? 'score-good' : analysis.qualityScore >= 40 ? 'score-ok' : 'score-poor'}`}>
                {analysis.qualityScore}<span>/100</span>
              </div>
              <div className="score-label">Draft Quality</div>
            </div>

            {analysis.readability.fleschReadingEase > 0 && (
              <div className="readability-card">
                <div className="readability-header">
                  <span className="readability-title">Readability</span>
                  <span className={`readability-level level-${analysis.readability.label.toLowerCase().replace(' ', '-')}`}>
                    {analysis.readability.label}
                  </span>
                </div>
                <div className="readability-details">
                  <div className="readability-stat">
                    <span className="readability-stat-value">{analysis.readability.fleschReadingEase}</span>
                    <span className="readability-stat-label">Flesch Score</span>
                  </div>
                  <div className="readability-stat">
                    <span className="readability-stat-value">{analysis.readability.gradeLevel}</span>
                    <span className="readability-stat-label">Grade Level</span>
                  </div>
                </div>
                <div className="readability-audience">{analysis.readability.audience}</div>
              </div>
            )}

            {/* Sentence Rhythm Sparkline */}
            {essayText.trim().length > 50 && (
              <SentenceRhythm
                text={essayText}
                onSentenceHover={onSentenceHover}
                onSentenceLeave={onSentenceLeave}
              />
            )}

            {analysis.fixFirst.length > 0 && (
              <div className="priority-section fix-first">
                <h3>Fix these first</h3>
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
                <h3>Then polish</h3>
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
                <span className="all-good-icon">{'\u2713'}</span>
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

        {/* CHECKLIST TAB */}
        {!loading && !error && analysis && activeTab === 'checklist' && (
          <div className="checklist-view">
            <h3>Before You Submit</h3>
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
              {wpmWarning ? (
                <div className="integrity-warning">
                  <p><strong>Writing speed suggests external source usage.</strong></p>
                  <p>Your typing speed exceeds {fastTypist ? 150 : 120} WPM, which is unusual for original composition. Review for authenticity.</p>
                </div>
              ) : (
                <p className="integrity-note">
                  This checklist helps you review your own work.<br/>
                  <strong>Write-Right never writes for you.</strong>
                </p>
              )}
              <label className="fast-typist-toggle">
                <input type="checkbox" checked={fastTypist} onChange={onFastTypistToggle} />
                <span>I'm a fast typist (raise threshold to 150 WPM)</span>
              </label>
            </div>
          </div>
        )}

        {/* STRUCTURE TAB - Issues + Structural Map */}
        {!loading && !error && analysis && activeTab === 'structure' && (
          <div className="issues-view">
            {/* Reverse Outline / Structural Map */}
            {reverseOutline && reverseOutline.paragraphs.length > 0 && (
              <div className="structural-map">
                <h3>Structural Map</h3>
                <p className="structural-map-subtitle">First and last sentence of each paragraph</p>
                <ul className="structural-map-list">
                  {reverseOutline.paragraphs.map(p => (
                    <li key={p.index} className={`structural-map-item ${p.isRisk ? 'risk' : ''}`}>
                      <div className="structural-map-header">
                        <span className="structural-map-index">P{p.index}</span>
                        <span className="structural-map-count">{p.sentenceCount} sentence{p.sentenceCount !== 1 ? 's' : ''}</span>
                        {p.isRisk && <span className="structural-map-risk">No development</span>}
                      </div>
                      <div className="structural-map-first">{p.firstSentence}</div>
                      {!p.isRisk && p.firstSentence !== p.lastSentence && (
                        <div className="structural-map-last">{p.lastSentence}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {issues.length === 0 ? (
              <div className="state">No structure issues {'\u2713'}</div>
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
                      <div className="issue-suggestion">{'\u2192'} {issue.microSuggestion}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* OTHER CATEGORY TABS */}
        {!loading && !error && analysis && !['overview', 'checklist', 'structure'].includes(activeTab) && (
          <div className="issues-view">
            {issues.length === 0 ? (
              <div className="state">No issues here {'\u2713'}</div>
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
                      <div className="issue-suggestion">{'\u2192'} {issue.microSuggestion}</div>
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
