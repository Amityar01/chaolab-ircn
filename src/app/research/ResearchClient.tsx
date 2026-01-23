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
  const [expandedId, setExpandedId] = useState<string | null>(themes[0]?.id || null);

  const sortedThemes = [...themes].sort((a, b) => (a.order || 99) - (b.order || 99));

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="research-page">
      <header className="research-header">
        <h1>{t({ en: 'Research', ja: '研究' })}</h1>
        <p className="research-intro">
          {t({
            en: 'Our lab investigates how the brain uses predictive coding to perceive, create, and adapt. We combine multi-species experiments with computational modeling to understand these fundamental processes.',
            ja: '私たちの研究室は、脳が予測符号化を使って知覚し、創造し、適応する仕組みを研究しています。複数種の実験と計算モデリングを組み合わせて、これらの基本的なプロセスを理解することを目指しています。'
          })}
        </p>
      </header>

      <div className="research-themes">
        {sortedThemes.map((theme) => {
          const isExpanded = expandedId === theme.id;
          const accentColor = theme.accentColor || 'var(--ircn-blue)';

          return (
            <article
              key={theme.id}
              className={`research-theme ${isExpanded ? 'expanded' : ''}`}
              style={{ '--accent': accentColor } as React.CSSProperties}
            >
              <button
                className="research-theme-header"
                onClick={() => toggleExpand(theme.id)}
                aria-expanded={isExpanded}
              >
                <div className="research-theme-label">
                  {theme.sectionLabel && (
                    <span className="section-label">{t(theme.sectionLabel)}</span>
                  )}
                  <h2>{t(theme.title)}</h2>
                  {theme.question && (
                    <p className="research-question">{t(theme.question)}</p>
                  )}
                </div>
                <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
              </button>

              <div className={`research-theme-content ${isExpanded ? 'open' : ''}`}>
                {/* Image and Description */}
                <div className="research-theme-body">
                  {theme.image && (
                    <div className="research-image">
                      <Image
                        src={theme.image}
                        alt={t(theme.title)}
                        width={400}
                        height={300}
                        style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                      />
                    </div>
                  )}
                  <div className="research-description">
                    <p>{t(theme.description)}</p>
                  </div>
                </div>

                {/* Methods and Findings */}
                {(theme.methods || theme.keyFindings) && (
                  <div className="research-details">
                    {theme.methods && (
                      <div className="research-section">
                        <h3>{t({ en: 'Methods & Approaches', ja: '手法とアプローチ' })}</h3>
                        <div className="research-list">{t(theme.methods)}</div>
                      </div>
                    )}
                    {theme.keyFindings && (
                      <div className="research-section">
                        <h3>{t({ en: 'Key Findings', ja: '主な発見' })}</h3>
                        <div className="research-list">{t(theme.keyFindings)}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Related Publications */}
                {theme.relatedPublications && theme.relatedPublications.length > 0 && (
                  <div className="research-publications">
                    <h3>{t({ en: 'Related Publications', ja: '関連論文' })}</h3>
                    <ul>
                      {theme.relatedPublications.map((doi) => (
                        <li key={doi}>
                          <a
                            href={`https://doi.org/${doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {doi}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {theme.tags && theme.tags.length > 0 && (
                  <div className="research-tags">
                    {theme.tags.map((tag) => (
                      <span key={tag} className="research-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <style jsx>{`
        .research-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .research-header {
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .research-header h1 {
          font-size: 2.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1a1a1a;
        }

        .research-intro {
          font-size: 1.125rem;
          color: #666;
          line-height: 1.7;
          max-width: 700px;
        }

        .research-themes {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .research-theme {
          background: #fafafa;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .research-theme:hover {
          border-color: #e0e0e0;
        }

        .research-theme.expanded {
          border-left: 3px solid var(--accent);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .research-theme-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .research-theme-label {
          flex: 1;
        }

        .section-label {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent);
          margin-bottom: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border-radius: 4px;
        }

        .research-theme-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 0.5rem 0;
        }

        .research-question {
          font-size: 1rem;
          color: #666;
          margin: 0;
          font-style: italic;
        }

        .expand-icon {
          font-size: 1.5rem;
          font-weight: 300;
          color: var(--accent);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          flex-shrink: 0;
          margin-left: 1rem;
        }

        .research-theme-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s ease;
        }

        .research-theme-content.open {
          max-height: 3000px;
          padding: 0 1.5rem 1.5rem;
        }

        .research-theme-body {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 640px) {
          .research-theme-body {
            grid-template-columns: 1fr 1.5fr;
            align-items: start;
          }
        }

        .research-image {
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
          border: 1px solid #f0f0f0;
        }

        .research-description {
          color: #444;
          line-height: 1.8;
        }

        .research-description p {
          margin: 0;
          white-space: pre-line;
        }

        .research-details {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          padding: 1.5rem;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
        }

        @media (min-width: 768px) {
          .research-details {
            grid-template-columns: 1fr 1fr;
          }
        }

        .research-section h3 {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--accent);
          margin-bottom: 0.75rem;
        }

        .research-list {
          font-size: 0.9rem;
          color: #555;
          line-height: 1.8;
          white-space: pre-line;
        }

        .research-publications {
          margin-bottom: 1.5rem;
          padding: 1rem 1.5rem;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
        }

        .research-publications h3 {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #666;
          margin-bottom: 0.75rem;
        }

        .research-publications ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .research-publications li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f5f5f5;
        }

        .research-publications li:last-child {
          border-bottom: none;
        }

        .research-publications a {
          font-size: 0.875rem;
          color: #6B46C1;
          text-decoration: none;
          font-family: monospace;
        }

        .research-publications a:hover {
          text-decoration: underline;
        }

        .research-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid #f0f0f0;
        }

        .research-tag {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          background: #f0f0f0;
          color: #666;
          border-radius: 100px;
        }
      `}</style>
    </div>
  );
}
