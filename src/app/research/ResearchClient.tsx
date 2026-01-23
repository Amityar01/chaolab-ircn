'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ResearchTheme } from '@/types/content';

interface ResearchClientProps {
  themes: ResearchTheme[];
}

export default function ResearchClient({ themes }: ResearchClientProps) {
  const { t } = useLanguage();
  const [activeTheme, setActiveTheme] = useState<string | null>(themes[0]?.id || null);

  const sortedThemes = [...themes].sort((a, b) => (a.order || 99) - (b.order || 99));
  const activeData = sortedThemes.find(th => th.id === activeTheme);

  return (
    <div className="research-page">
      {/* Header */}
      <header className="header">
        <span className="overline">{t({ en: 'Our Focus', ja: '研究分野' })}</span>
        <h1>{t({ en: 'Research', ja: '研究' })}</h1>
      </header>

      {/* Theme Navigation */}
      <nav className="theme-nav">
        {sortedThemes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setActiveTheme(theme.id)}
            className={`theme-tab ${activeTheme === theme.id ? 'active' : ''}`}
            style={{ '--tab-color': theme.accentColor || 'var(--firefly-glow)' } as React.CSSProperties}
          >
            {theme.sectionLabel && (
              <span className="tab-label">{t(theme.sectionLabel)}</span>
            )}
            <span className="tab-title">{t(theme.title)}</span>
          </button>
        ))}
      </nav>

      {/* Active Theme Content */}
      {activeData && (
        <article className="theme-content" key={activeData.id}>
          {/* Hero Section */}
          <div className="theme-hero" style={{ '--accent': activeData.accentColor || 'var(--firefly-glow)' } as React.CSSProperties}>
            <div className="hero-text">
              {activeData.question && (
                <p className="hero-question">{t(activeData.question)}</p>
              )}
              <div className="hero-description">
                {t(activeData.description)}
              </div>
            </div>
            {activeData.image && (
              <div className="hero-image">
                <Image
                  src={activeData.image}
                  alt={t(activeData.title)}
                  width={500}
                  height={400}
                  style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                />
              </div>
            )}
          </div>

          {/* Methods & Findings Grid */}
          {(activeData.methods || activeData.keyFindings) && (
            <div className="details-grid">
              {activeData.methods && (
                <div className="detail-card">
                  <div className="detail-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3>{t({ en: 'Methods', ja: '手法' })}</h3>
                  <div className="detail-content">{t(activeData.methods)}</div>
                </div>
              )}
              {activeData.keyFindings && (
                <div className="detail-card">
                  <div className="detail-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3>{t({ en: 'Key Findings', ja: '主な発見' })}</h3>
                  <div className="detail-content">{t(activeData.keyFindings)}</div>
                </div>
              )}
            </div>
          )}

          {/* Publications */}
          {activeData.relatedPublications && activeData.relatedPublications.length > 0 && (
            <div className="publications-section">
              <h3>{t({ en: 'Related Publications', ja: '関連論文' })}</h3>
              <div className="pub-links">
                {activeData.relatedPublications.map((doi) => (
                  <a
                    key={doi}
                    href={`https://doi.org/${doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pub-link"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {doi}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {activeData.tags && activeData.tags.length > 0 && (
            <div className="tags">
              {activeData.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </article>
      )}

      <style jsx>{`
        .research-page {
          max-width: 1000px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 2.5rem;
        }

        .overline {
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--firefly-glow);
          margin-bottom: 0.5rem;
        }

        .header h1 {
          font-size: 3rem;
          font-weight: 400;
          letter-spacing: -0.02em;
        }

        /* Theme Navigation */
        .theme-nav {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 3rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .theme-tab {
          flex-shrink: 0;
          padding: 1rem 1.5rem;
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          color: var(--text-secondary);
        }

        .theme-tab:hover {
          background: var(--card-hover);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .theme-tab.active {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--tab-color);
          box-shadow: 0 0 20px rgba(255, 213, 79, 0.1);
        }

        .theme-tab.active .tab-title {
          color: var(--text-primary);
        }

        .tab-label {
          display: block;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--tab-color);
          margin-bottom: 0.25rem;
          opacity: 0.8;
        }

        .theme-tab.active .tab-label {
          opacity: 1;
        }

        .tab-title {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-muted);
          transition: color 0.2s;
        }

        /* Theme Content */
        .theme-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .theme-hero {
          display: grid;
          gap: 2.5rem;
          margin-bottom: 3rem;
        }

        @media (min-width: 768px) {
          .theme-hero {
            grid-template-columns: 1.2fr 1fr;
            align-items: start;
          }
        }

        .hero-question {
          font-size: 1.75rem;
          font-weight: 400;
          font-style: italic;
          color: var(--accent);
          margin-bottom: 1.5rem;
          line-height: 1.3;
        }

        .hero-description {
          font-size: 1.05rem;
          line-height: 1.9;
          color: var(--text-secondary);
          white-space: pre-line;
        }

        .hero-image {
          border-radius: 16px;
          overflow: hidden;
          background: var(--twilight-blue);
          border: 1px solid var(--card-border);
        }

        /* Details Grid */
        .details-grid {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        @media (min-width: 640px) {
          .details-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .detail-card {
          padding: 1.75rem;
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid var(--card-border);
          border-radius: 16px;
        }

        .detail-icon {
          width: 40px;
          height: 40px;
          margin-bottom: 1rem;
          color: var(--firefly-glow);
          opacity: 0.8;
        }

        .detail-icon svg {
          width: 100%;
          height: 100%;
        }

        .detail-card h3 {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .detail-content {
          font-size: 0.9rem;
          line-height: 1.8;
          color: var(--text-secondary);
          white-space: pre-line;
        }

        /* Publications */
        .publications-section {
          margin-bottom: 2rem;
        }

        .publications-section h3 {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .pub-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .pub-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: var(--accent-purple);
          transition: all 0.2s;
        }

        .pub-link:hover {
          background: var(--card-hover);
          border-color: var(--accent-purple);
          color: var(--text-primary);
        }

        .pub-link svg {
          width: 14px;
          height: 14px;
          opacity: 0.6;
        }

        /* Tags */
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--card-border);
        }

        .tag {
          font-size: 0.7rem;
          padding: 0.35rem 0.85rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--card-border);
          color: var(--text-muted);
          border-radius: 100px;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .header h1 {
            font-size: 2rem;
          }

          .theme-nav {
            margin-left: -1rem;
            margin-right: -1rem;
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .hero-question {
            font-size: 1.35rem;
          }
        }

        /* Scrollbar for nav */
        .theme-nav::-webkit-scrollbar {
          height: 4px;
        }

        .theme-nav::-webkit-scrollbar-track {
          background: transparent;
        }

        .theme-nav::-webkit-scrollbar-thumb {
          background: var(--card-border);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
