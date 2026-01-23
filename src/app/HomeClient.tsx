'use client';

// ============================================
// HOME CLIENT - BIOLUMINESCENT INTELLIGENCE
// ============================================
// Main homepage with predictive fireflies

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import HeroSection from '@/components/home/HeroSection';
import TeamPreview from '@/components/home/TeamPreview';
import PublicationsPreview from '@/components/home/PublicationsPreview';
import ResearchCard from '@/components/home/ResearchCard';
import { DraggableToy } from '@/components/home/DraggableToy';
import { Legend } from '@/components/home/Legend';
import { PredictiveCanvas, useFireflyEngine, CONFIG, TOY_COLORS } from '@/components/predictive';
import type { Obstacle, ToyShape, Vec2 } from '@/components/predictive/types';
import type {
  HomepageSettings,
  NewsItem,
  ResearchTheme,
  Member,
  Publication,
  ContactInfo,
} from '@/types/content';

interface HomeClientProps {
  settings: HomepageSettings | null;
  contact: ContactInfo | null;
  news: NewsItem[];
  themes: ResearchTheme[];
  pi: Member | null;
  memberCount: number;
  publications: Publication[];
}

// Toy configuration - fewer toys, intentionally placed
const TOY_SHAPES: ToyShape[] = ['circle', 'triangle', 'square', 'diamond'];

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
  const [showHint, setShowHint] = useState(true);
  const [toyPositions, setToyPositions] = useState<Map<string, { position: Vec2; isDragging: boolean }>>(new Map());
  const [reducedMotion, setReducedMotion] = useState(false);

  // Refs for tracking elements
  const containerRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const pubsRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [canvasBounds, setCanvasBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Build obstacles from DOM elements
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  // Initialize toys with intentional positions along margins
  const initialToys = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Place toys deliberately - in margins, not random dump
    const positions: Vec2[] = [
      { x: width * 0.08, y: height * 0.25 },   // Left side, upper
      { x: width * 0.88, y: height * 0.35 },   // Right side
      { x: width * 0.12, y: height * 0.65 },   // Left side, lower
      { x: width * 0.85, y: height * 0.75 },   // Right side, lower
    ];

    return TOY_SHAPES.map((shape, i) => ({
      id: `toy_${i}`,
      shape,
      position: positions[i] || { x: 100, y: 300 + i * 150 },
      colorIndex: i,
    }));
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Initialize
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Update canvas bounds
  useEffect(() => {
    if (!containerRef.current) return;

    const updateBounds = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCanvasBounds({
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height,
      });
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [mounted]);

  // Update obstacles from DOM elements
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const updateObstacles = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newObstacles: Obstacle[] = [];

      // Add research cards as fixed obstacles
      cardRefs.current.forEach((element, id) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        newObstacles.push({
          id,
          type: 'fixed',
          bounds: {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          },
        });
      });

      // Add team section
      if (teamRef.current) {
        const rect = teamRef.current.getBoundingClientRect();
        newObstacles.push({
          id: 'team-section',
          type: 'fixed',
          bounds: {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          },
        });
      }

      // Add publications section
      if (pubsRef.current) {
        const rect = pubsRef.current.getBoundingClientRect();
        newObstacles.push({
          id: 'pubs-section',
          type: 'fixed',
          bounds: {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          },
        });
      }

      // Add toys as draggable obstacles
      toyPositions.forEach((data, id) => {
        newObstacles.push({
          id,
          type: 'draggable',
          bounds: {
            x: data.position.x,
            y: data.position.y,
            width: 50,
            height: 50,
          },
        });
      });

      setObstacles(newObstacles);
    };

    updateObstacles();
    window.addEventListener('scroll', updateObstacles);
    window.addEventListener('resize', updateObstacles);

    // Update periodically for smoother tracking
    const interval = setInterval(updateObstacles, 100);

    return () => {
      window.removeEventListener('scroll', updateObstacles);
      window.removeEventListener('resize', updateObstacles);
      clearInterval(interval);
    };
  }, [mounted, toyPositions]);

  // Handle toy position changes
  const handleToyPositionChange = useCallback((id: string, position: Vec2, isDragging: boolean) => {
    setToyPositions(prev => {
      const next = new Map(prev);
      next.set(id, { position, isDragging });
      return next;
    });
  }, []);

  // Set card ref
  const setCardRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  // Initialize firefly engine
  const { fireflies, time, isRunning } = useFireflyEngine(
    obstacles,
    canvasBounds,
    CONFIG.FIREFLY_COUNT,
    mounted && !reducedMotion
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--deep-space)' }}
    >
      {/* Firefly Canvas */}
      {mounted && !reducedMotion && (
        <PredictiveCanvas
          fireflies={fireflies}
          canvasBounds={canvasBounds}
          time={time}
          showParticles={true}
          showFOV={true}
          showEdges={true}
          showMemory={true}
        />
      )}

      {/* Draggable Toys */}
      {mounted && !reducedMotion && initialToys.map((toy, i) => (
        <DraggableToy
          key={toy.id}
          id={toy.id}
          shape={toy.shape}
          initialPosition={toy.position}
          size={45 + Math.random() * 15}
          colorIndex={i}
          onPositionChange={handleToyPositionChange}
          containerRef={containerRef}
        />
      ))}

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="nav">
          <div className="nav-container">
            <Link href="/" className="nav-logo">
              {settings?.labName ? t(settings.labName) : 'Chao Lab'}
            </Link>

            <nav className="nav-links">
              <Link href="/research" className="nav-link">
                {t({ en: 'Research', ja: '研究' })}
              </Link>
              <Link href="/publications" className="nav-link">
                {t({ en: 'Publications', ja: '論文' })}
              </Link>
              <Link href="/members" className="nav-link">
                {t({ en: 'Members', ja: 'メンバー' })}
              </Link>
              <Link href="/contact" className="nav-link">
                {t({ en: 'Contact', ja: '連絡先' })}
              </Link>

              <div className="lang-toggle">
                <button
                  onClick={() => setLanguage('en')}
                  className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ja')}
                  className={`lang-btn ${language === 'ja' ? 'active' : ''}`}
                >
                  日本語
                </button>
              </div>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <HeroSection />

        {/* Interactive hint */}
        {showHint && !reducedMotion && (
          <div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full text-sm flex items-center gap-3"
            style={{
              background: 'rgba(7, 11, 20, 0.9)',
              border: '1px solid var(--card-border)',
              backdropFilter: 'blur(12px)',
              color: 'var(--text-muted)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <span style={{ color: 'var(--firefly-glow)' }}>✦</span>
            {t({
              en: 'Watch the fireflies think — drag the shapes to surprise them',
              ja: 'ホタルの思考を観察 — 図形をドラッグして驚かせてみてください'
            })}
          </div>
        )}

        {/* Research Journey Section */}
        <section className="py-20 md:py-32 px-6 md:px-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            <p
              className="font-mono text-xs uppercase tracking-widest mb-4"
              style={{ color: 'var(--firefly-glow)' }}
            >
              {t({ en: 'Our Research Journey', ja: '研究の旅' })}
            </p>

            <h2 className="font-display text-3xl md:text-5xl text-[var(--text-primary)] mb-4 tracking-tight">
              {t({ en: 'From prediction to creativity', ja: '予測から創造性へ' })}
            </h2>

            <p className="text-[var(--text-muted)] mb-12 max-w-2xl text-lg">
              {t({
                en: 'Watch fireflies navigate using predictive coding — the same principles we study in the brain. Their glowing minds reveal attention, perception, and surprise.',
                ja: '予測符号化を使ってナビゲートするホタルを観察してください。光る脳が注意、知覚、驚きを明らかにします。'
              })}
            </p>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {sortedThemes.map((theme, index) => (
                <ResearchCard
                  key={theme.id}
                  ref={setCardRef(theme.id)}
                  sectionLabel={theme.sectionLabel || { en: '', ja: '' }}
                  question={theme.question || theme.title}
                  description={theme.description}
                  linkHref="/research"
                  accentColor={theme.accentColor || TOY_COLORS[index % TOY_COLORS.length]}
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
        <footer className="footer">
          <div className="footer-container">
            <div className="grid md:grid-cols-3 gap-10 mb-12">
              <div>
                <h3
                  className="font-display text-xl mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {settings?.labName ? t(settings.labName) : 'Chao Lab'}
                </h3>
                <p className="text-[var(--text-muted)] leading-relaxed">
                  {settings?.description
                    ? t(settings.description)
                    : t({
                        en: 'Understanding predictive coding and creativity in the brain.',
                        ja: '脳における予測符号化と創造性を理解する。'
                      })}
                </p>
              </div>

              <div>
                <h4
                  className="font-mono text-xs uppercase tracking-wide mb-4"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t({ en: 'Affiliations', ja: '所属' })}
                </h4>
                <div className="flex flex-col gap-3 text-[var(--text-muted)]">
                  <a
                    href="https://ircn.jp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--firefly-glow)] transition-colors"
                  >
                    IRCN, University of Tokyo
                  </a>
                  <a
                    href="https://www.u-tokyo.ac.jp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--text-primary)] transition-colors"
                  >
                    The University of Tokyo
                  </a>
                  <a
                    href="https://www.daikin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--accent-cyan)] transition-colors"
                  >
                    Daikin Industries
                  </a>
                </div>
              </div>

              <div>
                <h4
                  className="font-mono text-xs uppercase tracking-wide mb-4"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t({ en: 'Contact', ja: '連絡先' })}
                </h4>
                <a
                  href={`mailto:${contact?.email || 'zenas.c.chao@ircn.jp'}`}
                  className="text-[var(--text-muted)] hover:text-[var(--firefly-glow)] transition-colors"
                >
                  {contact?.email || 'zenas.c.chao@ircn.jp'}
                </a>
              </div>
            </div>

            <div
              className="pt-8 flex flex-wrap justify-between items-center gap-4 text-sm"
              style={{ borderTop: '1px solid var(--card-border)', color: 'var(--text-muted)' }}
            >
              <span>
                © {new Date().getFullYear()} {settings?.labName ? t(settings.labName) : 'Chao Lab'}, IRCN
              </span>
              <div className="flex gap-6">
                <Link href="/research" className="hover:text-[var(--text-primary)] transition-colors">
                  {t({ en: 'Research', ja: '研究' })}
                </Link>
                <Link href="/publications" className="hover:text-[var(--text-primary)] transition-colors">
                  {t({ en: 'Publications', ja: '論文' })}
                </Link>
                <Link href="/members" className="hover:text-[var(--text-primary)] transition-colors">
                  {t({ en: 'Members', ja: 'メンバー' })}
                </Link>
                <Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors">
                  {t({ en: 'Contact', ja: '連絡先' })}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Legend */}
      {mounted && !reducedMotion && <Legend />}
    </div>
  );
}
