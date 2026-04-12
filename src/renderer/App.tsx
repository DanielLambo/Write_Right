import React, { useState, useEffect, useRef, useCallback } from 'react';
import InsightsPanel from './components/InsightsPanel';
import TemplateSelector from './components/TemplateSelector';
import { AnalysisResult, CoachTab, WritingIssue } from './types';

const API_BASE = 'http://localhost:3051';

function App() {
  const [essayText, setEssayText] = useState('');
  const [activeTab, setActiveTab] = useState<CoachTab>('grammar');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      if (essayText.trim()) {
        fetch(`${API_BASE}/autosave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, content: essayText }),
        }).catch(console.error);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [essayText, sessionId]);

  // Auto-analyze after typing stops
  useEffect(() => {
    if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
    if (essayText.trim().length > 50) {
      analyzeTimeoutRef.current = setTimeout(() => handleAnalyze(true), 1500);
    }
    return () => {
      if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
    };
  }, [essayText]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [essayText]);

  const handleAnalyze = useCallback(async (silent = false) => {
    if (!essayText.trim()) {
      if (!silent) setError('Write something first');
      return;
    }
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essayText }),
      });
      if (!response.ok) throw new Error('Analysis failed');
      const data: AnalysisResult = await response.json();
      setAnalysis(data);
    } catch (err) {
      if (!silent) setError('Analysis failed');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [essayText]);

  const handleTemplateSelect = useCallback((content: string) => {
    setEssayText(content);
    setShowTemplates(false);
    setTimeout(() => editorRef.current?.focus(), 0);
  }, []);

  const handleIssueClick = (issue: WritingIssue) => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.setSelectionRange(issue.startIndex, issue.endIndex);
    }
  };

  const wordCount = essayText.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = essayText.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score-great';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-ok';
    return 'score-poor';
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Write-Right</h1>
        <div className="header-stats">
          <span>{wordCount} words</span>
          <span className="stat-divider">|</span>
          <span>{charCount} chars</span>
          <span className="stat-divider">|</span>
          <span>{readingTime} min read</span>
          {analysis && (
            <>
              <span className="stat-divider">|</span>
              <span className={`quality-badge ${getScoreColor(analysis.qualityScore)}`}>
                {analysis.qualityScore}/100
              </span>
            </>
          )}
          {analysis && analysis.readability.fleschReadingEase > 0 && (
            <>
              <span className="stat-divider">|</span>
              <span className="readability-badge" title={`Grade ${analysis.readability.gradeLevel} - ${analysis.readability.audience}`}>
                {analysis.readability.label}
              </span>
            </>
          )}
        </div>
        <div className="header-actions">
          {essayText.length > 0 && (
            <button className="clear-btn" onClick={() => { setEssayText(''); setAnalysis(null); setError(null); setShowTemplates(true); }}>
              Clear
            </button>
          )}
          <button className="analyze-btn" onClick={() => handleAnalyze()} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'} <kbd>⌘↵</kbd>
          </button>
        </div>
      </header>

      <main className="app-content">
        <section className="editor-section">
          {essayText === '' && showTemplates ? (
            <TemplateSelector onSelect={handleTemplateSelect} />
          ) : (
            <textarea
              ref={editorRef}
              className="editor"
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Start writing your essay here..."
              spellCheck={false}
            />
          )}
        </section>

        <aside className="insights-section">
          <InsightsPanel
            activeTab={activeTab}
            analysis={analysis}
            loading={loading}
            error={error}
            onTabChange={setActiveTab}
            onIssueClick={handleIssueClick}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
