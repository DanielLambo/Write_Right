import React, { forwardRef, useEffect, useRef } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange: (text: string, start: number, end: number) => void;
}

const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(
  ({ value, onChange, onSelectionChange }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    useEffect(() => {
      const handleSelection = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        onSelectionChange(selectedText, start, end);
      };

      const textarea = textareaRef.current;
      if (textarea) {
        textarea.addEventListener('mouseup', handleSelection);
        textarea.addEventListener('keyup', handleSelection);
        return () => {
          textarea.removeEventListener('mouseup', handleSelection);
          textarea.removeEventListener('keyup', handleSelection);
        };
      }
    }, [value, onSelectionChange, textareaRef]);

    const wordCount = value.split(/\s+/).filter(w => w.length > 0).length;

    return (
      <div className="editor-panel">
        <div className="editor-header">
          <h2>Essay Editor</h2>
          <div className="word-count">{wordCount} words</div>
        </div>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing your essay here... Select text and use keyboard shortcuts or buttons to get assistance."
        />
      </div>
    );
  }
);

Editor.displayName = 'Editor';

export default Editor;
