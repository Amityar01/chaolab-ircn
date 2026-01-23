'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-8 pt-20">
      <div className="max-w-4xl mx-auto w-full">
        <p className="text-sm uppercase tracking-widest text-[var(--text-muted)] mb-4">
          {t({ en: 'The Predictive Brain', ja: '予測する脳' })}
        </p>

        <h1 className="text-5xl md:text-7xl font-bold text-[var(--text)] tracking-tight mb-8">
          Chao Lab
        </h1>

        <p className="text-xl md:text-2xl text-[var(--text-muted)] leading-relaxed mb-6 max-w-2xl">
          {t({
            en: 'We study how the brain predicts, and how prediction enables creativity.',
            ja: '脳がどのように予測し、予測がどのように創造性を可能にするかを研究しています。'
          })}
        </p>

        <p className="text-base text-[var(--text-muted)] leading-relaxed mb-12 max-w-2xl opacity-80">
          {t({
            en: 'International Research Center for Neurointelligence (IRCN), University of Tokyo',
            ja: '東京大学 国際高等研究所 ニューロインテリジェンス国際研究機構（IRCN）'
          })}
          <span className="mx-2">•</span>
          {t({
            en: 'Daikin Industries collaboration',
            ja: 'ダイキン工業との共同研究'
          })}
        </p>

        <div className="flex flex-wrap gap-6 text-sm">
          <Link
            href="/research"
            className="inline-flex items-center text-[var(--ircn-blue)] hover:text-[var(--ircn-purple)] transition-colors font-medium"
          >
            {t({ en: 'Explore our research', ja: '研究内容を見る' })}
            <span className="ml-1">→</span>
          </Link>
          <Link
            href="/publications"
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            {t({ en: 'Publications', ja: '論文一覧' })}
          </Link>
          <Link
            href="/members"
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            {t({ en: 'Team', ja: 'メンバー' })}
          </Link>
        </div>
      </div>
    </section>
  );
}
