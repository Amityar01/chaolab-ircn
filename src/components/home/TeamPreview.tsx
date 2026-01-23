'use client';

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
      <section ref={ref} className="py-16 md:py-24 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3">
            {t({ en: 'The Team', ja: 'チーム' })}
          </p>

          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-10">
            {t({ en: 'Meet the researchers', ja: '研究者紹介' })}
          </h2>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            {pi && (
              <div className="bg-[var(--bg-card)] rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex items-start gap-5">
                  {pi.image && (
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={pi.image}
                        alt={language === 'ja' ? pi.name.ja : pi.name.en}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text)] mb-1">
                      {language === 'ja' ? pi.name.ja : pi.name.en}
                    </h3>
                    <p className="text-sm text-[var(--ircn-purple)] font-medium mb-3">
                      {t(pi.role)}
                    </p>
                    {pi.email && (
                      <a
                        href={`mailto:${pi.email}`}
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--ircn-blue)] transition-colors"
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
                  className="inline-flex items-center mt-4 text-sm font-medium text-[var(--ircn-blue)] hover:text-[var(--ircn-purple)] transition-colors"
                >
                  {t({ en: 'Full profile', ja: 'プロフィール詳細' })}
                  <span className="ml-1">→</span>
                </Link>
              </div>
            )}

            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl md:text-6xl font-bold text-[var(--ircn-blue)]">
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
                className="inline-flex items-center text-sm font-medium text-[var(--ircn-blue)] hover:text-[var(--ircn-purple)] transition-colors"
              >
                {t({ en: 'View all members', ja: 'メンバー一覧を見る' })}
                <span className="ml-1">→</span>
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
