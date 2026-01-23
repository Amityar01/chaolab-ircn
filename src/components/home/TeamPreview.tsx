'use client';

// ============================================
// TEAM PREVIEW COMPONENT
// ============================================
// Dark bioluminescent theme team section

import { forwardRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Member } from '@/types/content';

interface TeamPreviewProps {
  pi: Member | null;
  memberCount: number;
}

const TeamPreview = forwardRef<HTMLDivElement, TeamPreviewProps>(
  ({ pi, memberCount }, ref) => {
    const { t, language } = useLanguage();

    return (
      <section ref={ref} className="py-16 md:py-24 px-6 md:px-8 relative z-10">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          {/* Section label */}
          <p
            className="font-mono text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--accent-cyan)' }}
          >
            {t({ en: 'The Team', ja: 'チーム' })}
          </p>

          <h2 className="font-display text-3xl md:text-4xl text-[var(--text-primary)] mb-10">
            {t({ en: 'Meet the researchers', ja: '研究者紹介' })}
          </h2>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* PI Card */}
            {pi && (
              <div className="card">
                <div className="flex items-start gap-5">
                  {pi.image && (
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-[var(--card-border)]">
                      <Image
                        src={pi.image}
                        alt={language === 'ja' ? pi.name.ja : pi.name.en}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
                      {language === 'ja' ? pi.name.ja : pi.name.en}
                    </h3>
                    <p
                      className="text-sm font-medium mb-3"
                      style={{ color: 'var(--accent-purple)' }}
                    >
                      {t(pi.role)}
                    </p>
                    {pi.email && (
                      <a
                        href={`mailto:${pi.email}`}
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--firefly-glow)] transition-colors"
                      >
                        {pi.email}
                      </a>
                    )}
                  </div>
                </div>

                {pi.bio && (
                  <p className="mt-5 text-sm text-[var(--text-muted)] leading-relaxed line-clamp-4">
                    {t(pi.bio)}
                  </p>
                )}

                <Link
                  href={`/members/${pi.slug}`}
                  className="inline-flex items-center mt-4 text-sm font-medium transition-colors group"
                  style={{ color: 'var(--accent-cyan)' }}
                >
                  {t({ en: 'Full profile', ja: 'プロフィール詳細' })}
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
            )}

            {/* Member count */}
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-3 mb-4">
                <span
                  className="font-display text-5xl md:text-6xl font-bold"
                  style={{ color: 'var(--firefly-glow)' }}
                >
                  {memberCount}
                </span>
                <span className="text-xl text-[var(--text-muted)]">
                  {t({ en: 'researchers', ja: '名の研究者' })}
                </span>
              </div>

              <p className="text-[var(--text-muted)] leading-relaxed mb-6">
                {t({
                  en: 'Our team includes postdoctoral researchers, research scientists, and graduate students working across multiple disciplines.',
                  ja: 'ポスドク研究員、研究員、大学院生が複数の分野にまたがって研究を行っています。'
                })}
              </p>

              <Link
                href="/members"
                className="inline-flex items-center text-sm font-medium transition-colors group"
                style={{ color: 'var(--accent-cyan)' }}
              >
                {t({ en: 'View all members', ja: 'メンバー一覧を見る' })}
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
        </div>
      </section>
    );
  }
);

TeamPreview.displayName = 'TeamPreview';

export default TeamPreview;
