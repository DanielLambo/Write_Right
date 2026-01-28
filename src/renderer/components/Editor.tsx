import React, { forwardRef, useRef } from 'react';
import { WritingIssue } from '../types';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  issues?: WritingIssue[];
}

const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(
  ({ value, onChange, issues = [] }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const totalSignals = errorCount + warningCount;

    return (
      <>
        <div className="editor-header">
          <h2>Draft</h2>
          {totalSignals > 0 && (
            <div className="signal-summary">
              {errorCount > 0 && (
                <span className="signal-count critical">{errorCount} critical</span>
              )}
              {warningCount > 0 && (
                <span className="signal-count warning">{warningCount} to review</span>
              )}
            </div>
          )}
        </div>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Begin your essay here.

Write freely — this is your space to develop ideas, build arguments, and craft your voice.

When you're ready for revision insights, press ⌘↵ to analyze your draft."
          spellCheck={false}
          autoFocus
        />
      </>
    );
  }
);

Editor.displayName = 'Editor';

export default Editor;
