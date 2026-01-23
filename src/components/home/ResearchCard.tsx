'use client';

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
  ({ sectionLabel, question, description, linkHref, accentColor = 'var(--ircn-blue)' }, ref) => {
    const { t } = useLanguage();

    return (
      <div
        ref={ref}
        className="bg-[var(--bg-card)] rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100
                   hover:shadow-lg hover:border-gray-200 hover:-translate-y-1
                   transition-all duration-300 ease-out"
      >
        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3">
          {t(sectionLabel)}
        </p>

        <div
          className="w-12 h-0.5 mb-5"
          style={{ backgroundColor: accentColor }}
        />

        <h3 className="text-xl md:text-2xl font-semibold text-[var(--text)] mb-4 leading-snug">
          {t(question)}
        </h3>

        <p className="text-[var(--text-muted)] leading-relaxed mb-6 line-clamp-4">
          {t(description)}
        </p>

        <Link
          href={linkHref}
          className="inline-flex items-center text-sm font-medium transition-colors"
          style={{ color: accentColor }}
        >
          {t({ en: 'Learn more', ja: '詳しく見る' })}
          <span className="ml-1">→</span>
        </Link>
      </div>
    );
  }
);

ResearchCard.displayName = 'ResearchCard';

export default ResearchCard;
