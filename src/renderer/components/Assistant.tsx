import React from 'react';
import { AssistResponse } from '../types';

interface AssistantProps {
  activeMode: 'explain' | 'examples' | 'outline';
  response: AssistResponse | null;
  loading: boolean;
  error: string | null;
  onModeChange: (mode: 'explain' | 'examples' | 'outline') => void;
  onAssist: (mode: 'explain' | 'examples' | 'outline') => void;
  onCopy: () => void;
  onInsert: () => void;
}

const Assistant: React.FC<AssistantProps> = ({
  activeMode,
  response,
  loading,
  error,
  onModeChange,
  onAssist,
  onCopy,
  onInsert,
}) => {
  return (
    <div className="assistant-panel">
      <div className="assistant-header">
        <h2>Assistant</h2>
        <div className="mode-tabs">
          <button
            className={`tab ${activeMode === 'explain' ? 'active' : ''}`}
            onClick={() => {
              onModeChange('explain');
              onAssist('explain');
            }}
          >
            Explain
          </button>
          <button
            className={`tab ${activeMode === 'examples' ? 'active' : ''}`}
            onClick={() => {
              onModeChange('examples');
              onAssist('examples');
            }}
          >
            Examples
          </button>
          <button
            className={`tab ${activeMode === 'outline' ? 'active' : ''}`}
            onClick={() => {
              onModeChange('outline');
              onAssist('outline');
            }}
          >
            Outline
          </button>
        </div>
      </div>

      <div className="assistant-content">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Thinking...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && response && (
          <div className="response">
            <div className="response-header">
              <span className="selection-type">{response.selectionType}</span>
              <div className="response-actions">
                <button onClick={onCopy} className="btn-secondary">Copy</button>
                <button onClick={onInsert} className="btn-primary">Insert</button>
              </div>
            </div>

            <div className="response-body">
              <p className="summary">{response.summary}</p>

              {response.simplerRewrite && (
                <div className="rewrite">
                  <h3>Simpler rewrite:</h3>
                  <p>{response.simplerRewrite}</p>
                </div>
              )}

              {response.bullets && response.bullets.length > 0 && (
                <ul className="bullets">
                  {response.bullets.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              )}

              {response.examples && response.examples.length > 0 && (
                <div className="examples">
                  <h3>Examples:</h3>
                  {response.examples.map((example, idx) => (
                    <div key={idx} className="example-item">
                      <p>{example}</p>
                    </div>
                  ))}
                </div>
              )}

              {response.outline && response.outline.length > 0 && (
                <div className="outline">
                  <h3>Suggested Outline:</h3>
                  <ol>
                    {response.outline.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="follow-up">
                <strong>Follow-up:</strong> {response.followUpQuestion}
              </div>

              {response.reasoningNotes && (
                <details className="reasoning-notes">
                  <summary>Why this answer?</summary>
                  <p>{response.reasoningNotes}</p>
                </details>
              )}
            </div>
          </div>
        )}

        {!loading && !error && !response && (
          <div className="empty-state">
            <p>Select text in the editor and choose a mode:</p>
            <ul>
              <li><kbd>Cmd/Ctrl + E</kbd> for Explain</li>
              <li><kbd>Cmd/Ctrl + Shift + E</kbd> for Examples</li>
              <li><kbd>Cmd/Ctrl + O</kbd> for Outline</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              Demo: type a paragraph about “democracy,” highlight a sentence, then click Explain.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assistant;
