import React, { useState, useEffect, useRef } from 'react';
import Editor from './components/Editor';
import Assistant from './components/Assistant';
import { AssistResponse } from './types';

const API_BASE = 'http://localhost:3001';

function App() {
  const [essayText, setEssayText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [activeMode, setActiveMode] = useState<'explain' | 'examples' | 'outline'>('explain');
  const [assistantResponse, setAssistantResponse] = useState<AssistResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const editorRef = useRef<HTMLTextAreaElement>(null);

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
    }, 2000); // Autosave after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [essayText, sessionId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key === 'e' && !e.shiftKey) {
        e.preventDefault();
        handleAssist('explain');
      } else if (cmdOrCtrl && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        handleAssist('examples');
      } else if (cmdOrCtrl && e.key === 'o') {
        e.preventDefault();
        handleAssist('outline');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedText, essayText]);

  const handleSelectionChange = (text: string, start: number, end: number) => {
    setSelectedText(text);
    setSelectionStart(start);
    setSelectionEnd(end);
  };

  const handleAssist = async (mode: 'explain' | 'examples' | 'outline') => {
    if (!selectedText.trim() && mode !== 'outline') {
      setError('Please select some text first');
      return;
    }

    setActiveMode(mode);
    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      const response = await fetch(`${API_BASE}/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          selection: selectedText || essayText.substring(0, 100),
          essayText,
          selectionStart,
          selectionEnd,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data: AssistResponse = await response.json();
      setAssistantResponse(data);

      const latencyMs = Math.round(performance.now() - startTime);
      const wordCount = essayText.split(/\s+/).filter(w => w.length > 0).length;
      const selectionType = data.selectionType;
      const responseTextParts = [
        data.summary,
        ...(data.bullets || []),
        ...(data.examples || []),
        ...(data.outline || []),
        data.followUpQuestion,
        data.reasoningNotes || '',
      ];
      const responseLength = responseTextParts.join('\n').length;
      const length = essayText.length;
      const docLengthBucket =
        length < 500 ? '<500' : length < 1500 ? '500-1500' : '>1500';
      
      fetch(`${API_BASE}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: mode,
          selection: selectedText,
          selectionType,
          docLength: essayText.length,
          wordCount,
          latencyMs,
          responseLength,
          mode,
          docLengthBucket,
        }),
      }).catch(console.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get assistance');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!assistantResponse) return;
    
    const textToCopy = [
      assistantResponse.summary,
      ...(assistantResponse.bullets || []),
      ...(assistantResponse.examples || []),
      ...(assistantResponse.outline || []),
    ].join('\n');

    navigator.clipboard.writeText(textToCopy);
  };

  const handleInsertResponse = () => {
    if (!assistantResponse || !editorRef.current) return;

    const lines: string[] = [];
    lines.push('---');
    lines.push(`Assistant (${assistantResponse.mode.toUpperCase()})`);
    lines.push('');
    lines.push(assistantResponse.summary);

    if (assistantResponse.bullets?.length) {
      lines.push('');
      assistantResponse.bullets.forEach(b => lines.push(`- ${b}`));
    }

    if (assistantResponse.examples?.length) {
      lines.push('');
      lines.push('Examples:');
      assistantResponse.examples.forEach(e => lines.push(`- ${e}`));
    }

    if (assistantResponse.outline?.length) {
      lines.push('');
      lines.push('Outline:');
      assistantResponse.outline.forEach(o => lines.push(`- ${o}`));
    }

    lines.push('');
    lines.push(`Follow-up: ${assistantResponse.followUpQuestion}`);
    lines.push('---');

    const textToInsert = `\n\n${lines.join('\n')}\n`;
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = essayText.substring(0, start) + textToInsert + essayText.substring(end);
    
    setEssayText(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>Learning-While-Writing Assistant</h1>
        <div className="shortcuts-hint">
          Cmd/Ctrl+E: Explain | Cmd/Ctrl+Shift+E: Examples | Cmd/Ctrl+O: Outline
        </div>
      </div>
      <div className="app-content">
        <Editor
          ref={editorRef}
          value={essayText}
          onChange={setEssayText}
          onSelectionChange={handleSelectionChange}
        />
        <Assistant
          activeMode={activeMode}
          response={assistantResponse}
          loading={loading}
          error={error}
          onModeChange={setActiveMode}
          onAssist={handleAssist}
          onCopy={handleCopyResponse}
          onInsert={handleInsertResponse}
        />
      </div>
    </div>
  );
}

export default App;
