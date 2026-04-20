import React, { useState, useEffect, useRef, useCallback } from 'react';
import InsightsPanel from './components/InsightsPanel';
import TemplateSelector from './components/TemplateSelector';
import { AnalysisResult, AppMode, CoachTab, WritingIssue } from './types';

const API_BASE = 'http://localhost:3051';

function App() {
  const [essayText, setEssayText] = useState('');
  const [activeTab, setActiveTab] = useState<CoachTab>('grammar');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [mode, setMode] = useState<AppMode>('DRAFTING');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Integrity Guard: track active typing time and word count
  const activeTimeRef = useRef(0);
  const lastKeystrokeRef = useRef<number | null>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [wpmWarning, setWpmWarning] = useState(false);
  const [fastTypist, setFastTypist] = useState(false);
  const WPM_THRESHOLD = fastTypist ? 150 : 120;

  // Track active typing time (only while actually typing, not idle)
  useEffect(() => {
    typingIntervalRef.current = setInterval(() => {
      if (lastKeystrokeRef.current && Date.now() - lastKeystrokeRef.current < 2000) {
        activeTimeRef.current += 500;
      }
    }, 500);
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    lastKeystrokeRef.current = Date.now();
    setEssayText(e.target.value);
  }, []);

  // Check WPM on every analysis
  useEffect(() => {
    if (analysis && activeTimeRef.current > 0) {
      const minutes = activeTimeRef.current / 60000;
      if (minutes > 0.5) { // Only check after 30s of active typing
        const wpm = analysis.wordCount / minutes;
        setWpmWarning(wpm > WPM_THRESHOLD);
      }
    }
  }, [analysis]);

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

  // Auto-analyze after typing stops (only in AUDITING mode)
  useEffect(() => {
    if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
    if (mode === 'AUDITING' && essayText.trim().length > 50) {
      analyzeTimeoutRef.current = setTimeout(() => handleAnalyze(true), 1500);
    }
    return () => {
      if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
    };
  }, [essayText, mode]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        if (mode === 'DRAFTING') {
          setMode('AUDITING');
        }
        handleAnalyze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [essayText, mode]);

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

  const handleSentenceHover = useCallback((start: number, end: number) => {
    if (editorRef.current && mode === 'AUDITING') {
      editorRef.current.focus();
      editorRef.current.setSelectionRange(start, end);
    }
  }, [mode]);

  const handleSentenceLeave = useCallback(() => {
    // Don't clear selection — let user keep it
  }, []);

  const handleModeToggle = () => {
    const next = mode === 'DRAFTING' ? 'AUDITING' : 'DRAFTING';
    setMode(next);
    if (next === 'AUDITING' && essayText.trim().length > 50) {
      handleAnalyze();
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

  const isDrafting = mode === 'DRAFTING';

  return (
    <div className={`app ${isDrafting ? 'mode-drafting' : 'mode-auditing'}`}>
      <header className="app-header">
        <h1>Write-Right</h1>

        {/* Stats: hidden in drafting, visible in auditing */}
        {!isDrafting && (
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
        )}

        {isDrafting && <div className="header-stats"><span className="drafting-label">Distraction-Free Mode</span></div>}

        <div className="header-actions">
          {essayText.length > 0 && (
            <button className="clear-btn" onClick={() => { setEssayText(''); setAnalysis(null); setError(null); setShowTemplates(true); setWpmWarning(false); activeTimeRef.current = 0; }}>
              Clear
            </button>
          )}
          <button
            className={`mode-toggle ${isDrafting ? 'toggle-drafting' : 'toggle-auditing'}`}
            onClick={handleModeToggle}
          >
            {isDrafting ? 'Switch to Audit' : 'Switch to Draft'}
          </button>
          {!isDrafting && (
            <button className="analyze-btn" onClick={() => handleAnalyze()} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze'} <kbd>⌘↵</kbd>
            </button>
          )}
        </div>
      </header>

      <main className="app-content">
        <section className={`editor-section ${isDrafting ? 'editor-zen' : ''}`}>
          {essayText === '' && showTemplates ? (
            <TemplateSelector onSelect={handleTemplateSelect} />
          ) : (
            <textarea
              ref={editorRef}
              className="editor"
              value={essayText}
              onChange={handleTextChange}
              placeholder="Start writing your essay here..."
              spellCheck={false}
            />
          )}
        </section>

        {!isDrafting && (
          <aside className="insights-section insights-slide-in">
            <InsightsPanel
              activeTab={activeTab}
              analysis={analysis}
              loading={loading}
              error={error}
              essayText={essayText}
              wpmWarning={wpmWarning}
              fastTypist={fastTypist}
              onFastTypistToggle={() => setFastTypist(v => !v)}
              onTabChange={setActiveTab}
              onIssueClick={handleIssueClick}
              onSentenceHover={handleSentenceHover}
              onSentenceLeave={handleSentenceLeave}
            />
          </aside>
        )}
      </main>
    </div>
  );
}

export default App;
