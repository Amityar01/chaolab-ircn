'use client';

// ============================================
// RESEARCH CARD COMPONENT
// ============================================
// Fixed content card for research themes (dark theme)

import { forwardRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BilingualText } from '@/types/content';

interface ResearchCardProps {
  sectionLabel: BilingualText;
  question: BilingualText;
  description: BilingualText;
  linkHref: string;
  accentColor?: string;
}

const ResearchCard = forwardRef<HTMLDivElement, ResearchCardProps>(
  ({ sectionLabel, question, description, linkHref, accentColor = 'var(--firefly-glow)' }, ref) => {
    const { t } = useLanguage();

    return (
      <div
        ref={ref}
        className="research-card relative group"
        style={{
          '--accent-color': accentColor,
        } as React.CSSProperties}
      >
        {/* Accent line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] opacity-70"
          style={{ backgroundColor: accentColor }}
        />

        {/* Section label */}
        <p
          className="font-mono text-xs uppercase tracking-widest mb-4"
          style={{ color: accentColor }}
        >
          {t(sectionLabel)}
        </p>

        {/* Question/Title */}
        <h3 className="font-display text-xl md:text-2xl text-[var(--text-primary)] mb-4 leading-snug">
          {t(question)}
        </h3>

        {/* Description */}
        <p className="text-[var(--text-muted)] leading-relaxed mb-6 line-clamp-4">
          {t(description)}
        </p>

        {/* Link */}
        <Link
          href={linkHref}
          className="inline-flex items-center text-sm font-medium transition-all hover:gap-3"
          style={{ color: accentColor }}
        >
          {t({ en: 'Learn more', ja: '詳しく見る' })}
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
    );
  }
);

ResearchCard.displayName = 'ResearchCard';

export default ResearchCard;
