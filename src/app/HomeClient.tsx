'use client';

// ============================================
// HOME CLIENT - BIOLUMINESCENT INTELLIGENCE
// ============================================
// Main homepage with predictive fireflies (simplified)

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import HeroSection from '@/components/home/HeroSection';
import TeamPreview from '@/components/home/TeamPreview';
import PublicationsPreview from '@/components/home/PublicationsPreview';
import ResearchCard from '@/components/home/ResearchCard';
import { DraggableToy } from '@/components/home/DraggableToy';
import { FireflySystem } from '@/components/predictive/FireflySystem';
import { TOY_COLORS } from '@/components/predictive/config';
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

// Draggable toy shapes
const TOY_SHAPES = ['circle', 'triangle', 'diamond', 'hexagon'] as const;

interface ToyState {
  id: string;
  shape: typeof TOY_SHAPES[number];
  x: number;
  y: number;
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
  const [showHint, setShowHint] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [showBeliefs, setShowBeliefs] = useState(false);
  const [showPaths, setShowPaths] = useState(true);

  // Refs for tracking elements
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const researchSectionRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const pubsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Toy positions (draggable)
  const [toys, setToys] = useState<ToyState[]>([]);

  // Obstacles for fireflies
  const [obstacles, setObstacles] = useState<Array<{ id: string; x: number; y: number; width: number; height: number }>>([]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Initialize page size and toys
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowHint(false), 8000);

    const updateSize = () => {
      const w = window.innerWidth;
      // Use full document height
      const h = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      setViewportSize({ width: w, height: h });

      // Initialize toys in document coordinates
      setToys(prev => {
        if (prev.length > 0) return prev;
        const vh = window.innerHeight;
        return [
          { id: 'toy_0', shape: 'circle', x: w * 0.05, y: vh * 0.25 },
          { id: 'toy_1', shape: 'triangle', x: w * 0.92, y: vh * 0.20 },
          { id: 'toy_2', shape: 'diamond', x: w * 0.03, y: vh * 0.65 },
          { id: 'toy_3', shape: 'hexagon', x: w * 0.94, y: vh * 0.55 },
        ];
      });
    };

    // Delay initial size calculation to ensure DOM is ready
    setTimeout(updateSize, 50);
    window.addEventListener('resize', updateSize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Update obstacles from DOM elements (document coordinates)
  useEffect(() => {
    if (!mounted || viewportSize.width === 0) return;

    const getDocumentPosition = (el: HTMLElement, padding = 0) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + window.scrollX - padding,
        y: rect.top + window.scrollY - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      };
    };

    const updateObstacles = () => {
      const newObstacles: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];

      // Add nav/header
      const nav = containerRef.current?.querySelector('.nav');
      if (nav) {
        const pos = getDocumentPosition(nav as HTMLElement, 10);
        newObstacles.push({ id: 'nav', ...pos });
      }

      // Add hero section
      if (heroRef.current) {
        const pos = getDocumentPosition(heroRef.current, 20);
        newObstacles.push({ id: 'hero', ...pos });
      }

      // Add research section (the text/headers area)
      if (researchSectionRef.current) {
        const pos = getDocumentPosition(researchSectionRef.current, 15);
        newObstacles.push({ id: 'research-section', ...pos });
      }

      // Add research cards
      cardRefs.current.forEach((element, id) => {
        if (!element) return;
        const pos = getDocumentPosition(element, 10);
        newObstacles.push({ id, ...pos });
      });

      // Add team section
      if (teamRef.current) {
        const pos = getDocumentPosition(teamRef.current, 15);
        newObstacles.push({ id: 'team-section', ...pos });
      }

      // Add publications section
      if (pubsRef.current) {
        const pos = getDocumentPosition(pubsRef.current, 15);
        newObstacles.push({ id: 'pubs-section', ...pos });
      }

      // Add footer
      if (footerRef.current) {
        const pos = getDocumentPosition(footerRef.current, 10);
        newObstacles.push({ id: 'footer', ...pos });
      }

      // Add toys
      toys.forEach(toy => {
        newObstacles.push({
          id: toy.id,
          x: toy.x,
          y: toy.y,
          width: 50,
          height: 50,
        });
      });

      setObstacles(newObstacles);
    };

    // Update after layout settles and on window load
    const timer1 = setTimeout(updateObstacles, 200);
    const timer2 = setTimeout(updateObstacles, 500);
    window.addEventListener('load', updateObstacles);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('load', updateObstacles);
    };
  }, [mounted, viewportSize.width, toys]);

  // Handle toy drag - simple viewport coordinates
  const handleToyDrag = useCallback((id: string, x: number, y: number) => {
    setToys(prev => prev.map(toy =>
      toy.id === id ? { ...toy, x, y } : toy
    ));
  }, []);

  // Set card ref
  const setCardRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative"
      style={{ background: 'var(--deep-space)' }}
    >
      {/* Firefly System - fixed to viewport */}
      {mounted && !reducedMotion && viewportSize.width > 0 && (
        <FireflySystem
          obstacles={obstacles}
          width={viewportSize.width}
          height={viewportSize.height}
          showBeliefs={showBeliefs}
          showPaths={showPaths}
        />
      )}

      {/* Draggable Toys */}
      {mounted && !reducedMotion && toys.map((toy, i) => (
        <DraggableToy
          key={toy.id}
          id={toy.id}
          shape={toy.shape}
          x={toy.x}
          y={toy.y}
          size={50}
          color={TOY_COLORS[i % TOY_COLORS.length]}
          onDrag={handleToyDrag}
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
        <div ref={heroRef}>
          <HeroSection />
        </div>

        {/* Interactive hint */}
        {showHint && !reducedMotion && (
          <div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full text-sm flex items-center gap-3"
            style={{
              background: 'rgba(7, 11, 20, 0.9)',
              border: '1px solid var(--card-border)',
              backdropFilter: 'blur(12px)',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ color: 'var(--firefly-glow)' }}>✦</span>
            {t({
              en: 'Watch the fireflies learn — drag the shapes to surprise them',
              ja: 'ホタルの学習を観察 — 図形をドラッグして驚かせてみてください'
            })}
          </div>
        )}

        {/* Research Journey Section */}
        <section ref={researchSectionRef} className="py-20 md:py-32 px-6 md:px-8 relative z-10">
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
                en: 'Watch fireflies navigate using predictive coding — the same principles we study in the brain. They build beliefs about obstacles, show surprise when wrong, and confusion when things disappear.',
                ja: '予測符号化を使ってナビゲートするホタルを観察してください。障害物についての信念を形成し、予測が外れると驚き、物が消えると混乱します。'
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
        <footer ref={footerRef} className="footer">
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
      {mounted && !reducedMotion && (
        <div
          className="fixed bottom-4 left-4 z-40 font-mono text-xs flex flex-col gap-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: '#ff6b6b' }}>!</span>
            <span>collision surprise</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: '#a388ee' }}>?</span>
            <span>omission (it moved!)</span>
          </div>
          <div className="flex items-center gap-2 mt-1 opacity-70">
            <span style={{ color: 'var(--firefly-glow)' }}>○</span>
            <span>tap firefly = see mind</span>
          </div>
        </div>
      )}

      {/* Toggle controls */}
      {mounted && !reducedMotion && (
        <div
          className="fixed bottom-4 right-4 z-40 font-mono text-xs flex items-center gap-4"
          style={{ color: 'var(--text-muted)' }}
        >
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showBeliefs}
              onChange={(e) => setShowBeliefs(e.target.checked)}
              className="w-3 h-3"
              style={{ accentColor: '#ffb432' }}
            />
            beliefs
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showPaths}
              onChange={(e) => setShowPaths(e.target.checked)}
              className="w-3 h-3"
              style={{ accentColor: 'var(--firefly-glow)' }}
            />
            paths
          </label>
        </div>
      )}
    </div>
  );
}
