import React, { useState, useMemo, memo, useCallback } from 'react';

interface Props {
  text: string;
  onSentenceHover: (startIndex: number, endIndex: number) => void;
  onSentenceLeave: () => void;
}

interface SentenceInfo {
  text: string;
  wordCount: number;
  start: number;
  end: number;
}

const MAX_BARS = 200; // Cap to prevent DOM overload on huge documents

interface BarProps {
  sentence: SentenceInfo;
  index: number;
  maxWords: number;
  isHovered: boolean;
  onEnter: (idx: number) => void;
  onLeave: () => void;
}

function getBarColor(wc: number) {
  if (wc > 40) return '#ef4444';
  if (wc > 25) return '#f59e0b';
  if (wc < 10) return '#93c5fd';
  return '#6366f1';
}

const RhythmBar = memo(function RhythmBar({ sentence, index, maxWords, isHovered, onEnter, onLeave }: BarProps) {
  return (
    <div
      className={`rhythm-bar-wrap ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => onEnter(index)}
      onMouseLeave={onLeave}
    >
      <div
        className="rhythm-bar"
        style={{
          height: `${Math.max(4, (sentence.wordCount / maxWords) * 60)}px`,
          backgroundColor: getBarColor(sentence.wordCount),
        }}
      />
    </div>
  );
});

function SentenceRhythm({ text, onSentenceHover, onSentenceLeave }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sentences = useMemo((): SentenceInfo[] => {
    const result: SentenceInfo[] = [];
    const regex = /[^.!?]*[.!?]+/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const s = match[0].trim();
      if (s.length > 0) {
        result.push({
          text: s,
          wordCount: s.split(/\s+/).filter(w => w.length > 0).length,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
    return result;
  }, [text]);

  const handleEnter = useCallback((idx: number) => {
    setHoveredIdx(idx);
    const s = sentences[idx];
    if (s) onSentenceHover(s.start, s.end);
  }, [sentences, onSentenceHover]);

  const handleLeave = useCallback(() => {
    setHoveredIdx(null);
    onSentenceLeave();
  }, [onSentenceLeave]);

  if (sentences.length < 3) return null;

  const maxWords = Math.max(...sentences.map(s => s.wordCount), 1);
  const isCapped = sentences.length > MAX_BARS;
  const displaySentences = isCapped ? sentences.slice(0, MAX_BARS) : sentences;

  return (
    <div className="sentence-rhythm">
      <div className="rhythm-header">
        <span className="rhythm-title">Sentence Rhythm</span>
        <span className="rhythm-count">
          {sentences.length} sentences{isCapped ? ` (showing first ${MAX_BARS})` : ''}
        </span>
      </div>
      <div className="rhythm-chart">
        {displaySentences.map((s, i) => (
          <RhythmBar
            key={i}
            sentence={s}
            index={i}
            maxWords={maxWords}
            isHovered={hoveredIdx === i}
            onEnter={handleEnter}
            onLeave={handleLeave}
          />
        ))}
      </div>
      {hoveredIdx !== null && sentences[hoveredIdx] && (
        <div className="rhythm-tooltip">
          <strong>{sentences[hoveredIdx].wordCount} words</strong>
          <span>{sentences[hoveredIdx].text.substring(0, 60)}{sentences[hoveredIdx].text.length > 60 ? '...' : ''}</span>
        </div>
      )}
      <div className="rhythm-legend">
        <span className="rhythm-legend-item"><span className="rhythm-dot" style={{ background: '#93c5fd' }} />Short (&lt;10)</span>
        <span className="rhythm-legend-item"><span className="rhythm-dot" style={{ background: '#6366f1' }} />Normal</span>
        <span className="rhythm-legend-item"><span className="rhythm-dot" style={{ background: '#f59e0b' }} />Long (25+)</span>
        <span className="rhythm-legend-item"><span className="rhythm-dot" style={{ background: '#ef4444' }} />Very Long (40+)</span>
      </div>
    </div>
  );
}

export default memo(SentenceRhythm);
