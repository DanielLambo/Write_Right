import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from './components/Editor';
import InsightsPanel from './components/InsightsPanel';
import { AnalysisResult, CoachTab, WritingIssue } from './types';

const API_BASE = 'http://localhost:3051';

function App() {
  const [essayText, setEssayText] = useState('');
  const [activeTab, setActiveTab] = useState<CoachTab>('grammar');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave effect
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

  // Debounced background analysis
  useEffect(() => {
    if (analyzeTimeoutRef.current) {
      clearTimeout(analyzeTimeoutRef.current);
    }

    if (essayText.trim().length > 50) {
      analyzeTimeoutRef.current = setTimeout(() => {
        handleAnalyze(true);
      }, 1500);
    }

    return () => {
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
      }
    };
  }, [essayText]);

  // Update "last analyzed" display
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
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
      if (!silent) setError('Begin writing to analyze your draft');
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

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data: AnalysisResult = await response.json();
      setAnalysis(data);
      setLastAnalyzed(new Date());

      if (!silent) {
        fetch(`${API_BASE}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            action: 'analyze',
            selection: '',
            selectionType: 'FULL',
            docLength: essayText.length,
            wordCount: data.wordCount,
            latencyMs: 0,
            responseLength: data.issues.length,
            mode: 'analyze',
            docLengthBucket: essayText.length < 500 ? '<500' : essayText.length < 1500 ? '500-1500' : '>1500',
          }),
        }).catch(console.error);
      }
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Analysis unavailable');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [essayText, sessionId]);

  const handleIssueClick = (issue: WritingIssue) => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.setSelectionRange(issue.startIndex, issue.endIndex);
      const lineHeight = 24;
      const charsPerLine = 80;
      const approxLine = Math.floor(issue.startIndex / charsPerLine);
      editorRef.current.scrollTop = approxLine * lineHeight;
    }
  };

  const getTimeSinceAnalysis = () => {
    if (!lastAnalyzed) return null;
    const seconds = Math.floor((Date.now() - lastAnalyzed.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const wordCount = essayText.split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Write-Right</h1>
        </div>
        <div className="header-center">
          <div className="header-stats">
            <span className="stat">
              <span className="stat-value">{wordCount}</span>
              <span className="stat-label">words</span>
            </span>
            <span className="stat-divider" />
            <span className="stat">
              <span className="stat-value">{readingTime}</span>
              <span className="stat-label">min</span>
            </span>
            {analysis && (
              <>
                <span className="stat-divider" />
                <span className="stat draft-quality" title="Draft Quality Score">
                  <span className="stat-value">{analysis.qualityScore}</span>
                  <span className="stat-label">quality</span>
                </span>
              </>
            )}
          </div>
        </div>
        <div className="header-right">
          {lastAnalyzed && (
            <span className="last-analyzed">Analyzed {getTimeSinceAnalysis()}</span>
          )}
          <span className="shortcut-hint">
            <kbd>⌘</kbd><kbd>↵</kbd>
          </span>
        </div>
      </header>

      <main className="app-content">
        <section className="editor-section">
          <Editor
            ref={editorRef}
            value={essayText}
            onChange={setEssayText}
            issues={analysis?.issues || []}
          />
        </section>
        <aside className="insights-section">
          <InsightsPanel
            activeTab={activeTab}
            analysis={analysis}
            loading={loading}
            error={error}
            onTabChange={setActiveTab}
            onAnalyze={() => handleAnalyze()}
            onIssueClick={handleIssueClick}
          />
        </aside>
      </main>

      <footer className="app-footer">
        <span className="integrity-badge" title="Write-Right helps you revise — it never writes for you">
          Designed to improve your writing — not replace it.
        </span>
      </footer>
    </div>
  );
}

export default App;
