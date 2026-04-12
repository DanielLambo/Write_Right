import React, { useState, useMemo } from 'react';
import { TemplateCategory } from '../types';
import { TEMPLATE_CATEGORIES, TEMPLATES } from '../templates';

interface Props {
  onSelect: (content: string) => void;
}

export default function TemplateSelector({ onSelect }: Props) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let results = TEMPLATES;
    if (activeCategory !== 'all') {
      results = results.filter(t => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }
    return results;
  }, [activeCategory, searchQuery]);

  return (
    <div className="template-selector">
      <div className="template-header">
        <h2>What are you writing?</h2>
        <p>Pick a template for structure, or start from scratch.</p>
        <input
          className="template-search"
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="template-categories">
        <button
          className={`template-cat-pill ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`template-cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="template-grid">
        {filtered.map(template => (
          <button
            key={template.id}
            className="template-card"
            onClick={() => onSelect(template.content)}
          >
            <span className="template-card-icon">{template.icon}</span>
            <h3 className="template-card-name">{template.name}</h3>
            <p className="template-card-desc">{template.description}</p>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="template-empty">No templates match your search.</div>
        )}
      </div>

      <div className="template-footer">
        <button className="template-freewrite-btn" onClick={() => onSelect('')}>
          Start with blank page
        </button>
      </div>
    </div>
  );
}
