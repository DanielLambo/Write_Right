import React, { useState, useEffect, useRef, useCallback } from 'react';
import InsightsPanel from './components/InsightsPanel';
import TemplateSelector from './components/TemplateSelector';
import { AnalysisResult, AppMode, CoachTab, WritingIssue } from './types';
import { API_BASE, ENDPOINTS, TIMINGS, THRESHOLDS } from './config';

interface DraftMeta {
  sessionId: string;
  wordCount: number;
  charCount: number;
  preview: string;
  modifiedAt: number;
}

function App() {
  const [essayText, setEssayText] = useState('');
  const [activeTab, setActiveTab] = useState<CoachTab>('grammar');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [mode, setMode] = useState<AppMode>('DRAFTING');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [recoveredDraft, setRecoveredDraft] = useState<DraftMeta | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [analyzedIndicator, setAnalyzedIndicator] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyzeAbortRef = useRef<AbortController | null>(null);
  const indicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Integrity Guard refs
  const activeTimeRef = useRef(0);
  const lastKeystrokeRef = useRef<number | null>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [wpmWarning, setWpmWarning] = useState(false);
  const [fastTypist, setFastTypist] = useState(false);
  const WPM_THRESHOLD = fastTypist ? THRESHOLDS.wpmFastTypist : THRESHOLDS.wpmStandard;

  // Track active typing time (paused when idle > typingIdleThresholdMs)
  useEffect(() => {
    typingIntervalRef.current = setInterval(() => {
      if (lastKeystrokeRef.current && Date.now() - lastKeystrokeRef.current < TIMINGS.typingIdleThresholdMs) {
        activeTimeRef.current += TIMINGS.activeTimeTickMs;
      }
    }, TIMINGS.activeTimeTickMs);
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // On mount: check for a recent draft to offer recovery
  useEffect(() => {
    fetch(`${API_BASE}${ENDPOINTS.autosaveLatest}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.draft && data.draft.wordCount > 5) {
          setRecoveredDraft(data.draft);
        }
      })
      .catch(() => {/* ignore */});
  }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    lastKeystrokeRef.current = Date.now();
    setEssayText(e.target.value);
  }, []);

  // WPM warning check on every analysis
  useEffect(() => {
    if (analysis && activeTimeRef.current > THRESHOLDS.wpmActiveTimeMinMs) {
      const minutes = activeTimeRef.current / 60000;
      const wpm = analysis.wordCount / minutes;
      setWpmWarning(wpm > WPM_THRESHOLD);
    }
  }, [analysis, WPM_THRESHOLD]);

  // Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      if (essayText.trim()) {
        fetch(`${API_BASE}${ENDPOINTS.autosave}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, content: essayText }),
        }).catch(console.error);
      }
    }, TIMINGS.autosaveDebounceMs);
    return () => clearTimeout(timer);
  }, [essayText, sessionId]);

  // Auto-analyze (only in AUDITING mode)
  useEffect(() => {
    if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
    if (mode === 'AUDITING' && essayText.trim().length > THRESHOLDS.autoAnalyzeMinChars) {
      analyzeTimeoutRef.current = setTimeout(() => handleAnalyze(true), TIMINGS.autoAnalyzeDebounceMs);
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
        if (mode === 'DRAFTING') setMode('AUDITING');
        handleAnalyze();
      }
      if (e.key === 'Escape') {
        setShowExportMenu(false);
        setShowClearConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [essayText, mode]);

  const flashAnalyzedIndicator = useCallback(() => {
    setAnalyzedIndicator(true);
    if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
    indicatorTimeoutRef.current = setTimeout(() => setAnalyzedIndicator(false), TIMINGS.indicatorFlashMs);
  }, []);

  const handleAnalyze = useCallback(async (silent = false) => {
    if (!essayText.trim()) {
      if (!silent) setError('Write something first');
      return;
    }
    // Cancel any in-flight request so a stale response can't overwrite fresh state
    if (analyzeAbortRef.current) analyzeAbortRef.current.abort();
    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await fetch(`${API_BASE}${ENDPOINTS.analyze}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essayText }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Analysis failed');
      const data: AnalysisResult = await response.json();
      setAnalysis(data);
      if (silent) flashAnalyzedIndicator();
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // Ignore aborts
      if (!silent) setError('Analysis failed');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [essayText, flashAnalyzedIndicator]);

  const handleTemplateSelect = useCallback((content: string) => {
    setEssayText(content);
    setShowTemplates(false);
    setRecoveredDraft(null);
    setTimeout(() => editorRef.current?.focus(), 0);
  }, []);

  const handleRestoreDraft = useCallback(async () => {
    if (!recoveredDraft) return;
    try {
      const r = await fetch(`${API_BASE}${ENDPOINTS.autosave}/${recoveredDraft.sessionId}`);
      if (!r.ok) return;
      const data = await r.json();
      setEssayText(data.content);
      setShowTemplates(false);
      setRecoveredDraft(null);
      setTimeout(() => editorRef.current?.focus(), 0);
    } catch {
      setError('Could not restore draft');
    }
  }, [recoveredDraft]);

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

  const handleSentenceLeave = useCallback(() => {}, []);

  const handleModeToggle = () => {
    const next = mode === 'DRAFTING' ? 'AUDITING' : 'DRAFTING';
    setMode(next);
    if (next === 'AUDITING' && essayText.trim().length > THRESHOLDS.autoAnalyzeMinChars) {
      handleAnalyze();
    }
  };

  const resetAll = () => {
    if (analyzeAbortRef.current) analyzeAbortRef.current.abort();
    setEssayText('');
    setAnalysis(null);
    setError(null);
    setShowTemplates(true);
    setWpmWarning(false);
    setShowClearConfirm(false);
    activeTimeRef.current = 0;
    lastKeystrokeRef.current = null;
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(essayText);
      setShowExportMenu(false);
    } catch {
      setError('Copy failed');
    }
  }, [essayText]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([essayText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `write-right-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [essayText]);

  const wordCount = essayText.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = essayText.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / THRESHOLDS.readingWordsPerMin));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score-great';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-ok';
    return 'score-poor';
  };

  const isDrafting = mode === 'DRAFTING';
  const formatAge = (ms: number) => {
    const mins = Math.floor((Date.now() - ms) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className={`app ${isDrafting ? 'mode-drafting' : 'mode-auditing'}`}>
      <header className="app-header">
        <h1>Write-Right</h1>

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
            {analyzedIndicator && <span className="analyzed-indicator">Updated</span>}
          </div>
        )}

        {isDrafting && <div className="header-stats"><span className="drafting-label">Distraction-Free Mode</span></div>}

        <div className="header-actions">
          {essayText.length > 0 && (
            <div className="export-wrap">
              <button
                className="export-btn"
                onClick={() => setShowExportMenu(v => !v)}
                aria-haspopup="menu"
                aria-expanded={showExportMenu}
              >
                Export
              </button>
              {showExportMenu && (
                <div className="export-menu" role="menu">
                  <button onClick={handleCopy}>Copy to clipboard</button>
                  <button onClick={handleDownload}>Download as .txt</button>
                </div>
              )}
            </div>
          )}
          {essayText.length > 0 && (
            showClearConfirm ? (
              <div className="clear-confirm">
                <span>Clear everything?</span>
                <button className="clear-confirm-yes" onClick={resetAll}>Yes</button>
                <button className="clear-confirm-no" onClick={() => setShowClearConfirm(false)}>No</button>
              </div>
            ) : (
              <button className="clear-btn" onClick={() => setShowClearConfirm(true)}>Clear</button>
            )
          )}
          <button
            className={`mode-toggle ${isDrafting ? 'toggle-drafting' : 'toggle-auditing'}`}
            onClick={handleModeToggle}
          >
            {isDrafting ? 'Switch to Audit' : 'Switch to Draft'}
          </button>
          {!isDrafting && (
            <button className="analyze-btn" onClick={() => handleAnalyze()} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze'} <kbd>{'⌘↵'}</kbd>
            </button>
          )}
        </div>
      </header>

      {recoveredDraft && essayText === '' && (
        <div className="draft-recovery-banner">
          <div className="draft-recovery-content">
            <div className="draft-recovery-title">
              You have an unsaved draft from {formatAge(recoveredDraft.modifiedAt)}
              <span className="draft-recovery-stats"> - {recoveredDraft.wordCount} words</span>
            </div>
            <div className="draft-recovery-preview">"{recoveredDraft.preview}{recoveredDraft.preview.length >= 140 ? '...' : ''}"</div>
          </div>
          <div className="draft-recovery-actions">
            <button className="draft-recovery-restore" onClick={handleRestoreDraft}>Restore</button>
            <button className="draft-recovery-dismiss" onClick={() => setRecoveredDraft(null)}>Dismiss</button>
          </div>
        </div>
      )}

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
