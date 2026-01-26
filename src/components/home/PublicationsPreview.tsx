'use client';

// ============================================
// PUBLICATIONS PREVIEW COMPONENT
// ============================================
// Dark bioluminescent theme publications section

import { forwardRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Publication } from '@/types/content';

interface PublicationsPreviewProps {
  publications: Publication[];
}

const PublicationsPreview = forwardRef<HTMLDivElement, PublicationsPreviewProps>(
  ({ publications }, ref) => {
    const { t } = useLanguage();

    const formatAuthors = (authors: string[]) => {
      if (authors.length <= 3) {
        return authors.join(', ');
      }
      return `${authors.slice(0, 3).join(', ')} et al.`;
    };

    return (
      <section
        ref={ref}
        className="pt-32 md:pt-48 pb-20 md:pb-32 px-6 md:px-8 relative z-10 pointer-events-auto"
        style={{ background: 'var(--card-glass)' }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Section label */}
          <p
            className="font-mono text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--accent-purple)' }}
          >
            {t({ en: 'Recent Work', ja: '最新の研究' })}
          </p>

          <h2 className="font-display text-3xl md:text-4xl text-[var(--text-primary)] mb-10">
            {t({ en: 'Latest publications', ja: '最新の論文' })}
          </h2>

          <div className="space-y-1">
            {publications.slice(0, 4).map((pub) => (
              <article
                key={pub.id}
                className="group py-5 border-b transition-colors"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-medium text-[var(--text-primary)] leading-snug mb-2 group-hover:text-[var(--firefly-glow)] transition-colors">
                      {pub.doi ? (
                        <a
                          href={`https://doi.org/${pub.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {pub.title}
                        </a>
                      ) : (
                        pub.title
                      )}
                    </h3>

                    <p className="text-sm text-[var(--text-secondary)] mb-1">
                      {formatAuthors(pub.authors)}
                    </p>

                    <p className="text-sm text-[var(--text-muted)] italic">
                      {pub.journal || pub.conference}
                      {pub.volume && ` ${pub.volume}`}
                      {pub.pages && `, ${pub.pages}`}
                    </p>
                  </div>

                  <span
                    className="font-mono text-sm font-medium flex-shrink-0"
                    style={{ color: 'var(--accent-purple)' }}
                  >
                    {pub.year}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/publications"
              className="inline-flex items-center text-sm font-medium transition-colors group"
              style={{ color: 'var(--accent-purple)' }}
            >
              {t({ en: 'View all publications', ja: 'すべての論文を見る' })}
              <svg
                className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 12l4-4-4-4" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    );
  }
);

PublicationsPreview.displayName = 'PublicationsPreview';

export default PublicationsPreview;
