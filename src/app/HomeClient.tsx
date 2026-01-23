'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import HeroSection from '@/components/home/HeroSection';
import TeamPreview from '@/components/home/TeamPreview';
import PublicationsPreview from '@/components/home/PublicationsPreview';
import type { HomepageSettings, NewsItem, ResearchTheme, Member, Publication, ContactInfo, BilingualText } from '@/types/content';

const PredictiveCreature = dynamic(() => import('@/components/PredictiveCreature'), {
  ssr: false
});

interface Obstacle {
  id: string;
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

// Draggable research card
interface DraggableCardProps {
  id: string;
  initialX?: number;
  initialY?: number;
  sectionLabel: BilingualText;
  question: BilingualText;
  description: BilingualText;
  linkHref: string;
  accentColor: string;
  onPositionChange: (id: string, x: number, y: number, width: number, height: number) => void;
  gridPosition: { row: number; col: number };
}

function DraggableCard({
  id,
  sectionLabel,
  question,
  description,
  linkHref,
  accentColor,
  onPositionChange,
  gridPosition,
}: DraggableCardProps) {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);

  // Report position to parent
  useEffect(() => {
    if (!cardRef.current) return;

    const updatePosition = () => {
      const rect = cardRef.current!.getBoundingClientRect();
      onPositionChange(id, rect.left, rect.top + window.scrollY, rect.width, rect.height);
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [id, onPositionChange, position]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'A') return;

    e.preventDefault();
    const rect = cardRef.current!.getBoundingClientRect();

    if (!hasBeenDragged) {
      setPosition({ x: rect.left, y: rect.top + window.scrollY });
      setHasBeenDragged(true);
    }

    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !position) return;

    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y + window.scrollY;

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if ((e.target as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const resetPosition = () => {
    setPosition(null);
    setHasBeenDragged(false);
  };

  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: position.x,
        top: position.y - window.scrollY,
        zIndex: isDragging ? 100 : 50,
        width: cardRef.current?.offsetWidth,
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
        cursor: isDragging ? 'grabbing' : 'grab',
      }
    : {
        cursor: 'grab',
      };

  return (
    <div
      ref={cardRef}
      className={`
        bg-white rounded-2xl p-6 md:p-8
        border-2 border-gray-100
        shadow-lg hover:shadow-xl
        transition-all duration-300 ease-out
        touch-none select-none
        ${isDragging ? 'shadow-2xl scale-[1.02]' : ''}
        ${!position ? 'hover:-translate-y-1' : ''}
      `}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Drag indicator */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-30">
        <div className="w-1 h-1 rounded-full bg-gray-400" />
        <div className="w-1 h-1 rounded-full bg-gray-400" />
      </div>

      {hasBeenDragged && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            resetPosition();
          }}
          className="absolute top-3 left-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          onPointerDown={(e) => e.stopPropagation()}
        >
          reset
        </button>
      )}

      <p
        className="text-xs uppercase tracking-widest mb-3 font-medium"
        style={{ color: accentColor }}
      >
        {t(sectionLabel)}
      </p>

      <div
        className="w-16 h-1 rounded-full mb-5"
        style={{ backgroundColor: accentColor }}
      />

      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 leading-tight">
        {t(question)}
      </h3>

      <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3 text-sm md:text-base">
        {t(description)}
      </p>

      <Link
        href={linkHref}
        className="inline-flex items-center text-sm font-semibold transition-all hover:gap-2"
        style={{ color: accentColor }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {t({ en: 'Explore', ja: '詳しく' })}
        <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </div>
  );
}

export default function HomeClient({
  settings,
  contact,
  themes,
  pi,
  memberCount,
  publications,
}: HomeClientProps) {
  const sortedThemes = [...themes].sort((a, b) => (a.order || 99) - (b.order || 99));
  const { t, language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [showHint, setShowHint] = useState(true);

  const teamRef = useRef<HTMLDivElement>(null);
  const pubsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleCardPositionChange = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    setObstacles(prev => {
      const existing = prev.findIndex(o => o.id === id);
      const newObstacle = { id, x, y, width, height };

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newObstacle;
        return updated;
      }
      return [...prev, newObstacle];
    });
  }, []);

  // Track team and publications sections as obstacles
  useEffect(() => {
    if (!mounted) return;

    const updateSectionObstacles = () => {
      const newObstacles: Obstacle[] = [];

      if (teamRef.current) {
        const rect = teamRef.current.getBoundingClientRect();
        newObstacles.push({
          id: 'team-section',
          x: rect.left,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        });
      }

      if (pubsRef.current) {
        const rect = pubsRef.current.getBoundingClientRect();
        newObstacles.push({
          id: 'pubs-section',
          x: rect.left,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        });
      }

      setObstacles(prev => {
        const cardObstacles = prev.filter(o => !o.id.includes('section'));
        return [...cardObstacles, ...newObstacles];
      });
    };

    updateSectionObstacles();
    window.addEventListener('scroll', updateSectionObstacles);
    window.addEventListener('resize', updateSectionObstacles);

    return () => {
      window.removeEventListener('scroll', updateSectionObstacles);
      window.removeEventListener('resize', updateSectionObstacles);
    };
  }, [mounted]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-x-hidden">
      {mounted && <PredictiveCreature obstacles={obstacles} creatureCount={4} showDebug={false} />}

      <div className="relative z-10">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-lg border-b border-gray-200/50">
          <div className="max-w-6xl mx-auto px-6 md:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
                {settings?.labName ? t(settings.labName) : 'Chao Lab'}
              </Link>

              <nav className="flex items-center gap-6 md:gap-8">
                <Link
                  href="/research"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block font-medium"
                >
                  {t({ en: 'Research', ja: '研究' })}
                </Link>
                <Link
                  href="/publications"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block font-medium"
                >
                  {t({ en: 'Publications', ja: '論文' })}
                </Link>
                <Link
                  href="/members"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block font-medium"
                >
                  {t({ en: 'Members', ja: 'メンバー' })}
                </Link>
                <Link
                  href="/contact"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block font-medium"
                >
                  {t({ en: 'Contact', ja: '連絡先' })}
                </Link>

                <button
                  onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-medium"
                >
                  {language === 'en' ? '日本語' : 'EN'}
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <HeroSection />

        {/* Interactive hint */}
        {showHint && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/90 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 animate-pulse">
            <span className="text-emerald-400">↕</span>
            {t({ en: 'Try dragging the cards below', ja: 'カードをドラッグしてみてください' })}
          </div>
        )}

        {/* Research Journey Cards */}
        <section className="py-20 md:py-32 px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 mb-4 font-semibold">
              {t({ en: 'Our Research Journey', ja: '研究の旅' })}
            </p>

            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              {t({ en: 'From prediction to creativity', ja: '予測から創造性へ' })}
            </h2>

            <p className="text-gray-500 mb-12 max-w-2xl text-lg">
              {t({
                en: 'Watch our creatures navigate using predictive coding — the same principles we study in the brain. Try moving the cards!',
                ja: '予測符号化を使ってナビゲートする生き物を観察してください。カードを動かしてみてください！'
              })}
            </p>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {sortedThemes.map((theme, index) => (
                <DraggableCard
                  key={theme.id}
                  id={theme.id}
                  sectionLabel={theme.sectionLabel || { en: '', ja: '' }}
                  question={theme.question || theme.title}
                  description={theme.description}
                  linkHref="/research"
                  accentColor={theme.accentColor || 'var(--ircn-blue)'}
                  onPositionChange={handleCardPositionChange}
                  gridPosition={{ row: Math.floor(index / 2), col: index % 2 }}
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
        <footer className="py-16 px-6 md:px-8 border-t border-gray-200 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10 mb-12">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {settings?.labName ? t(settings.labName) : 'Chao Lab'}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {settings?.description
                    ? t(settings.description)
                    : t({
                        en: 'Understanding predictive coding and creativity in the brain.',
                        ja: '脳における予測符号化と創造性を理解する。'
                      })}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  {t({ en: 'Affiliations', ja: '所属' })}
                </h4>
                <div className="flex flex-col gap-3 text-gray-500">
                  <a
                    href="https://ircn.jp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-600 transition-colors"
                  >
                    IRCN, University of Tokyo
                  </a>
                  <a
                    href="https://www.u-tokyo.ac.jp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-900 transition-colors"
                  >
                    The University of Tokyo
                  </a>
                  <a
                    href="https://www.daikin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sky-500 transition-colors"
                  >
                    Daikin Industries
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  {t({ en: 'Contact', ja: '連絡先' })}
                </h4>
                <a
                  href={`mailto:${contact?.email || 'zenas.c.chao@ircn.jp'}`}
                  className="text-gray-500 hover:text-emerald-600 transition-colors"
                >
                  {contact?.email || 'zenas.c.chao@ircn.jp'}
                </a>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200 flex flex-wrap justify-between items-center gap-4 text-sm text-gray-400">
              <span>
                © {new Date().getFullYear()} {settings?.labName ? t(settings.labName) : 'Chao Lab'}, IRCN
              </span>
              <div className="flex gap-6">
                <Link href="/research" className="hover:text-gray-900 transition-colors">
                  {t({ en: 'Research', ja: '研究' })}
                </Link>
                <Link href="/publications" className="hover:text-gray-900 transition-colors">
                  {t({ en: 'Publications', ja: '論文' })}
                </Link>
                <Link href="/members" className="hover:text-gray-900 transition-colors">
                  {t({ en: 'Members', ja: 'メンバー' })}
                </Link>
                <Link href="/contact" className="hover:text-gray-900 transition-colors">
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
