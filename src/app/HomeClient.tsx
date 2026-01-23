'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import HeroSection from '@/components/home/HeroSection';
import ResearchCard from '@/components/home/ResearchCard';
import TeamPreview from '@/components/home/TeamPreview';
import PublicationsPreview from '@/components/home/PublicationsPreview';
import type { HomepageSettings, NewsItem, ResearchTheme, Member, Publication, ContactInfo } from '@/types/content';

const FireflyBackground = dynamic(() => import('@/components/FireflyBackground'), {
  ssr: false
});

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HomeClientProps {
  settings: HomepageSettings | null;
  contact: ContactInfo | null;
  news: NewsItem[];
  themes: ResearchTheme[];
  pi: Member | null;
  memberCount: number;
  publications: Publication[];
}

export default function HomeClient({
  settings,
  contact,
  themes,
  pi,
  memberCount,
  publications,
}: HomeClientProps) {
  // Sort themes by order
  const sortedThemes = [...themes].sort((a, b) => (a.order || 99) - (b.order || 99));
  const { t, language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const teamRef = useRef<HTMLDivElement>(null);
  const pubsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateObstacles = useCallback(() => {
    const newObstacles: Obstacle[] = [];

    cardRefs.current.forEach((ref) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        newObstacles.push({
          x: rect.left,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height
        });
      }
    });

    if (teamRef.current) {
      const rect = teamRef.current.getBoundingClientRect();
      newObstacles.push({
        x: rect.left,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      });
    }

    if (pubsRef.current) {
      const rect = pubsRef.current.getBoundingClientRect();
      newObstacles.push({
        x: rect.left,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      });
    }

    setObstacles(newObstacles);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleUpdate = () => {
      requestAnimationFrame(updateObstacles);
    };

    handleUpdate();
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [mounted, updateObstacles]);

  return (
    <div className="min-h-screen bg-[var(--bg)] relative">
      {mounted && <FireflyBackground obstacles={obstacles} fireflyCount={6} />}

      <div className="relative z-10">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]/80 backdrop-blur-md border-b border-gray-100/50">
          <div className="max-w-6xl mx-auto px-6 md:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-lg font-semibold text-[var(--text)] tracking-tight">
                {settings?.labName ? t(settings.labName) : 'Chao Lab'}
              </Link>

              <nav className="flex items-center gap-6 md:gap-8">
                <Link
                  href="/research"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors hidden md:block"
                >
                  {t({ en: 'Research', ja: '研究' })}
                </Link>
                <Link
                  href="/publications"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors hidden md:block"
                >
                  {t({ en: 'Publications', ja: '論文' })}
                </Link>
                <Link
                  href="/members"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors hidden md:block"
                >
                  {t({ en: 'Members', ja: 'メンバー' })}
                </Link>
                <Link
                  href="/contact"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors hidden md:block"
                >
                  {t({ en: 'Contact', ja: '連絡先' })}
                </Link>

                <button
                  onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-2 py-1 rounded border border-gray-200 hover:border-gray-300"
                >
                  {language === 'en' ? '日本語' : 'EN'}
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <HeroSection />

        {/* Research Journey Cards */}
        <section className="py-16 md:py-24 px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3">
              {t({ en: 'Our Research Journey', ja: '研究の旅' })}
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-10">
              {t({ en: 'From prediction to creativity', ja: '予測から創造性へ' })}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {sortedThemes.map((theme, index) => (
                <ResearchCard
                  key={theme.id}
                  ref={(el) => { cardRefs.current[index] = el; }}
                  sectionLabel={theme.sectionLabel || { en: '', ja: '' }}
                  question={theme.question || theme.title}
                  description={theme.description}
                  linkHref="/research"
                  accentColor={theme.accentColor || 'var(--ircn-blue)'}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Team Preview */}
        <TeamPreview
          ref={teamRef}
          pi={pi}
          memberCount={memberCount}
        />

        {/* Publications Preview */}
        <PublicationsPreview
          ref={pubsRef}
          publications={publications}
        />

        {/* Footer */}
        <footer className="py-12 px-6 md:px-8 border-t border-gray-100 bg-[var(--bg)]">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-10">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
                  {settings?.labName ? t(settings.labName) : 'Chao Lab'}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {settings?.description
                    ? t(settings.description)
                    : t({
                        en: 'Understanding predictive coding and creativity in the brain.',
                        ja: '脳における予測符号化と創造性を理解する。'
                      })}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[var(--text)] mb-4">
                  {t({ en: 'Affiliations', ja: '所属' })}
                </h4>
                <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
                  <a
                    href="https://ircn.jp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--ircn-blue)] transition-colors"
                  >
                    IRCN, University of Tokyo
                  </a>
                  <a
                    href="https://www.u-tokyo.ac.jp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--text)] transition-colors"
                  >
                    The University of Tokyo
                  </a>
                  <a
                    href="https://www.daikin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--daikin-blue)] transition-colors"
                  >
                    Daikin Industries
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[var(--text)] mb-4">
                  {t({ en: 'Contact', ja: '連絡先' })}
                </h4>
                <a
                  href={`mailto:${contact?.email || 'zenas.c.chao@ircn.jp'}`}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--ircn-blue)] transition-colors"
                >
                  {contact?.email || 'zenas.c.chao@ircn.jp'}
                </a>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4 text-xs text-[var(--text-muted)]">
              <span>
                © {new Date().getFullYear()} {settings?.labName ? t(settings.labName) : 'Chao Lab'}, IRCN, University of Tokyo
              </span>
              <div className="flex gap-4">
                <Link href="/research" className="hover:text-[var(--text)] transition-colors">
                  {t({ en: 'Research', ja: '研究' })}
                </Link>
                <Link href="/publications" className="hover:text-[var(--text)] transition-colors">
                  {t({ en: 'Publications', ja: '論文' })}
                </Link>
                <Link href="/members" className="hover:text-[var(--text)] transition-colors">
                  {t({ en: 'Members', ja: 'メンバー' })}
                </Link>
                <Link href="/contact" className="hover:text-[var(--text)] transition-colors">
                  {t({ en: 'Contact', ja: '連絡先' })}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
