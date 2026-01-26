'use client';

// ============================================
// HOME CLIENT - BIOLUMINESCENT INTELLIGENCE
// ============================================
// Main homepage with predictive fireflies (simplified)

import { useState, useEffect, useRef, useCallback } from 'react';
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

type ToyShape = 'brain-tl' | 'brain-tr' | 'brain-bl' | 'brain-br';

const TOY_MARGIN = 16;
const TOY_SHELF_EXTRA_SPACE = 120;

const getToySize = (viewportWidth: number) => {
  if (viewportWidth < 420) return 72;
  if (viewportWidth < 768) return 84;
  return 112;
};

interface ToyState {
  id: string;
  shape: ToyShape;
  x: number;
  y: number;
}

export default function HomeClient({
  settings,
  themes,
  pi,
  memberCount,
  publications,
}: HomeClientProps) {
  const sortedThemes = [...themes].sort((a, b) => (a.order || 99) - (b.order || 99));
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [toySize, setToySize] = useState(84);

  // Refs for tracking elements
  const containerRef = useRef<HTMLDivElement>(null);
  const toyShelfRef = useRef<HTMLDivElement>(null);

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
      const viewportW = window.innerWidth;
      const nextToySize = getToySize(viewportW);
      const containerRect = containerRef.current?.getBoundingClientRect();
      const w = Math.round(containerRect?.width ?? viewportW);
      // Use full document height - fireflies cover entire page
      const h = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      setViewportSize({ width: w, height: h });
      setToySize(nextToySize);

      // Initialize toys
      setToys(prev => {
        if (prev.length > 0) return prev;
        const clusterSize = nextToySize * 2;
        const container = containerRef.current;
        const shelf = toyShelfRef.current;

        const baseX = Math.round(
          Math.max(
            TOY_MARGIN,
            Math.min(w - clusterSize - TOY_MARGIN, (w - clusterSize) / 2)
          )
        );

        let baseY = Math.round(window.innerHeight * 0.72);
        if (container && shelf) {
          const containerRect = container.getBoundingClientRect();
          const shelfRect = shelf.getBoundingClientRect();
          baseY = Math.round(
            shelfRect.top - containerRect.top + Math.max(TOY_MARGIN, TOY_SHELF_EXTRA_SPACE / 2)
          );
        }

        return [
          { id: 'toy_0', shape: 'brain-tl', x: baseX, y: baseY },
          { id: 'toy_1', shape: 'brain-tr', x: baseX + nextToySize, y: baseY },
          { id: 'toy_2', shape: 'brain-bl', x: baseX, y: baseY + nextToySize },
          { id: 'toy_3', shape: 'brain-br', x: baseX + nextToySize, y: baseY + nextToySize },
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

  // Detect real content elements as obstacles
  useEffect(() => {
    if (!mounted || viewportSize.width === 0) return;

    const updateObstacles = () => {
      const newObstacles: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      let idx = 0;

      // Get actual text bounds using Range API
      const getTextBounds = (el: Element): DOMRect | null => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = range.getClientRects();
        if (rects.length === 0) return null;

        // Merge all line rects into one bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          if (r.width < 5) continue; // Skip tiny rects
          minX = Math.min(minX, r.left);
          minY = Math.min(minY, r.top);
          maxX = Math.max(maxX, r.right);
          maxY = Math.max(maxY, r.bottom);
        }
        if (minX === Infinity) return null;
        return new DOMRect(minX, minY, maxX - minX, maxY - minY);
      };

      // Text elements - use Range API for actual text bounds
      const textSelectors = ['h1', 'h2', 'h3', 'p'];
      textSelectors.forEach(selector => {
        container.querySelectorAll(selector).forEach(el => {
          const textRect = getTextBounds(el);
          if (!textRect || textRect.width < 10 || textRect.height < 10) return;

          const x = textRect.left - containerRect.left;
          const y = textRect.top - containerRect.top;

          newObstacles.push({
            id: `text-${idx++}`,
            x: x - 5,
            y: y - 3,
            width: textRect.width + 10,
            height: textRect.height + 6,
          });
        });
      });

      // Block elements - use bounding rect
      const blockSelectors = ['.research-card', 'footer'];
      blockSelectors.forEach(selector => {
        container.querySelectorAll(selector).forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width < 20 || rect.height < 20) return;

          const x = rect.left - containerRect.left;
          const y = rect.top - containerRect.top;

          newObstacles.push({
            id: `block-${idx++}`,
            x: x,
            y: y,
            width: rect.width,
            height: rect.height,
          });
        });
      });

      // Add toys
      toys.forEach(toy => {
        newObstacles.push({
          id: toy.id,
          x: toy.x,
          y: toy.y,
          width: toySize,
          height: toySize,
        });
      });

      setObstacles(newObstacles);
    };

    // Calculate after DOM is ready
    const timer = setTimeout(updateObstacles, 500);
    window.addEventListener('resize', updateObstacles);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateObstacles);
    };
  }, [mounted, viewportSize.width, viewportSize.height, toys, toySize]);

  // Handle toy drag - simple viewport coordinates
  const handleToyDrag = useCallback((id: string, x: number, y: number) => {
    setToys(prev => prev.map(toy =>
      toy.id === id ? { ...toy, x, y } : toy
    ));
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
          size={toySize}
          color={TOY_COLORS[i % TOY_COLORS.length]}
          onDrag={handleToyDrag}
        />
      ))}

      {/* Main Content */}
      <div className="relative z-10 pointer-events-none">
        {/* Hero Section */}
        <HeroSection settings={settings} />

        {/* Space for the brain puzzle to start assembled under the hero */}
        <div
          ref={toyShelfRef}
          aria-hidden="true"
          className="relative pointer-events-none"
          style={{ height: reducedMotion ? 0 : toySize * 2 + TOY_SHELF_EXTRA_SPACE }}
        />

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
                en: 'Watch fireflies navigate using predictive coding — the same principles we study in the brain. They build beliefs about obstacles, show surprise when wrong, and confusion when things disappear.',
                ja: '予測符号化を使ってナビゲートするホタルを観察してください。障害物についての信念を形成し、予測が外れると驚き、物が消えると混乱します。'
              })}
            </p>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {sortedThemes.map((theme, index) => (
                <div key={theme.id} className="research-card">
                  <ResearchCard
                    sectionLabel={theme.sectionLabel || { en: '', ja: '' }}
                    question={theme.question || theme.title}
                    description={theme.description}
                    linkHref="/research"
                    accentColor={theme.accentColor || TOY_COLORS[index % TOY_COLORS.length]}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Preview */}
        <div className="team-preview">
          <TeamPreview
            pi={pi}
            memberCount={memberCount}
          />
        </div>

        {/* Publications Preview */}
        <div className="publications-preview">
          <PublicationsPreview
            publications={publications}
          />
        </div>
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

    </div>
  );
}
