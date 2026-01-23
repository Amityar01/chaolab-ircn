'use client';

// ============================================
// HERO SECTION COMPONENT
// ============================================
// Dark bioluminescent theme hero

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import type { HomepageSettings } from '@/types/content';

interface HeroSectionProps {
  settings?: HomepageSettings | null;
}

export default function HeroSection({ settings }: HeroSectionProps) {
  const { t } = useLanguage();
  const hasHeroImage = Boolean(settings?.heroImage);
  const labName = settings?.labName ? t(settings.labName) : 'Chao Lab';

  return (
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-8 relative z-10">
      <div
        className={[
          'max-w-6xl mx-auto w-full',
          hasHeroImage ? 'grid lg:grid-cols-2 gap-12 items-center' : '',
        ].filter(Boolean).join(' ')}
      >
        <div>
        {/* Tagline */}
        <p
          className="font-mono text-sm uppercase tracking-widest mb-6 animate-fade-in-up"
          style={{ color: 'var(--firefly-glow)', opacity: 0.9 }}
        >
          {settings?.tagline
            ? t(settings.tagline)
            : t({ en: 'The Predictive Brain', ja: '予測する脳' })}
        </p>

        {/* Lab Name */}
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-[var(--text-primary)] tracking-tight mb-8 animate-fade-in-up delay-100">
          {labName}
        </h1>

        {/* Main description */}
        <p className="font-body text-xl md:text-2xl text-[var(--text-secondary)] leading-relaxed mb-6 max-w-2xl animate-fade-in-up delay-200">
          {settings?.description
            ? t(settings.description)
            : t({
              en: 'We study how the brain predicts, and how prediction enables creativity.',
              ja: '脳がどのように予測し、予測がどのように創造性を可能にするかを研究しています。'
            })}
        </p>

        {/* Affiliation */}
        <p className="text-base text-[var(--text-muted)] leading-relaxed mb-12 max-w-2xl animate-fade-in-up delay-300">
          {t({
            en: 'International Research Center for Neurointelligence (IRCN), University of Tokyo',
            ja: '東京大学 国際高等研究所 ニューロインテリジェンス国際研究機構（IRCN）'
          })}
          <span className="mx-2 opacity-50">•</span>
          {t({
            en: 'Daikin Industries collaboration',
            ja: 'ダイキン工業との共同研究'
          })}
        </p>

        {/* Links */}
        <div className="flex flex-wrap gap-6 text-sm animate-fade-in-up delay-400">
          <Link
            href="/research"
            className="inline-flex items-center font-medium transition-all group"
            style={{ color: 'var(--firefly-glow)' }}
          >
            {t({ en: 'Explore our research', ja: '研究内容を見る' })}
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
          <Link
            href="/publications"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {t({ en: 'Publications', ja: '論文一覧' })}
          </Link>
          <Link
            href="/members"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {t({ en: 'Team', ja: 'メンバー' })}
          </Link>
        </div>
        </div>

        {hasHeroImage && settings?.heroImage && (
          <div className="relative w-full max-w-md mx-auto lg:mx-0 aspect-[3/4] rounded-2xl overflow-hidden border border-[var(--card-border)]">
            <Image
              src={settings.heroImage}
              alt={labName}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(7, 11, 20, 0.85), transparent 55%)',
              }}
            />
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-fade-in delay-700">
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xs text-[var(--text-muted)] opacity-50">
            {t({ en: 'scroll', ja: 'スクロール' })}
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-[var(--text-muted)] to-transparent opacity-30" />
        </div>
      </div>
    </section>
  );
}
