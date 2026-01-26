'use client';

// ============================================
// TEAM PREVIEW COMPONENT
// ============================================
// Dark bioluminescent theme team section with rotating members

import { forwardRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Member } from '@/types/content';

const ROTATE_INTERVAL = 30000; // 30 seconds per member
const FADE_DURATION = 1500; // 1.5s fade for smoother dissolve

interface TeamPreviewProps {
  members: Member[];
  memberCount: number;
  pi?: Member;
}

const TeamPreview = forwardRef<HTMLDivElement, TeamPreviewProps>(
  ({ members, memberCount, pi: _pi }, ref) => {
    const { t, language } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Pick a random next member (different from current)
    const pickRandomNext = useCallback(() => {
      if (members.length <= 1) return 0;
      let next;
      do {
        next = Math.floor(Math.random() * members.length);
      } while (next === currentIndex);
      return next;
    }, [members.length, currentIndex]);

    // Rotate members randomly
    useEffect(() => {
      if (members.length <= 1) return;

      const interval = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(pickRandomNext());
          setIsTransitioning(false);
        }, FADE_DURATION / 2);
      }, ROTATE_INTERVAL);

      return () => clearInterval(interval);
    }, [members.length, pickRandomNext]);

    const currentMember = members[currentIndex];

    return (
      <section ref={ref} className="pb-20 md:pb-32 px-6 md:px-8 relative z-10" style={{ paddingTop: '200px' }}>
        <div className="max-w-5xl mx-auto">
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

          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            {/* Member Card - rotates through members */}
            {currentMember && (
              <div
                className="card pointer-events-auto"
                style={{
                  opacity: isTransitioning ? 0 : 1,
                  transition: `opacity ${FADE_DURATION}ms ease-in-out`,
                }}
              >
                <div className="flex items-start gap-5">
                  {currentMember.image && (
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-[var(--card-border)]">
                      <Image
                        src={currentMember.image}
                        alt={language === 'ja' ? currentMember.name.ja : currentMember.name.en}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
                      {language === 'ja' ? currentMember.name.ja : currentMember.name.en}
                    </h3>
                    <p
                      className="text-sm font-medium mb-3"
                      style={{ color: 'var(--accent-purple)' }}
                    >
                      {t(currentMember.role)}
                    </p>
                    {currentMember.email && (
                      <a
                        href={`mailto:${currentMember.email}`}
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--firefly-glow)] transition-colors"
                      >
                        {currentMember.email}
                      </a>
                    )}
                  </div>
                </div>

                {currentMember.bio && (
                  <p className="mt-5 text-sm text-[var(--text-muted)] leading-relaxed line-clamp-4">
                    {t(currentMember.bio)}
                  </p>
                )}

                <Link
                  href={`/members/${currentMember.slug}`}
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
            <div className="flex flex-col justify-center pointer-events-auto">
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
