'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import type { HomepageSettings, NewsItem, ResearchTheme } from '@/types/content';

// Dynamic import for canvas component
const PredictiveParticles = dynamic(() => import('@/components/PredictiveParticles'), {
  ssr: false
});

interface HomeClientProps {
  settings: HomepageSettings | null;
  news: NewsItem[];
  themes: ResearchTheme[];
}

export default function HomeClient({ settings, news, themes }: HomeClientProps) {
  const { t, language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white relative">
      {/* Predictive Particles Background */}
      {mounted && <PredictiveParticles />}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900 tracking-tight">
              Chao Lab
            </Link>

            <nav className="flex items-center gap-8">
              <Link href="/research" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t({ en: 'Research', ja: '研究' })}
              </Link>
              <Link href="/publications" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t({ en: 'Publications', ja: '論文' })}
              </Link>
              <Link href="/members" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t({ en: 'Members', ja: 'メンバー' })}
              </Link>
              <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t({ en: 'Contact', ja: '連絡先' })}
              </Link>

              <button
                onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors ml-4"
              >
                {language === 'en' ? 'JP' : 'EN'}
              </button>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <main className="min-h-screen flex flex-col justify-center px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 tracking-tight mb-8">
              Chao Lab
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-6">
              {t({
                en: 'We study how the brain predicts, and how prediction enables creativity.',
                ja: '脳がどのように予測し、予測がどのように創造性を可能にするかを研究しています。'
              })}
            </p>

            <p className="text-lg text-gray-500 leading-relaxed mb-12">
              {t({
                en: 'Based at IRCN, University of Tokyo. In collaboration with Daikin on creativity research.',
                ja: '東京大学IRCN所属。ダイキンと創造性研究で共同研究中。'
              })}
            </p>

            <div className="flex flex-wrap gap-6 text-sm">
              <Link
                href="/research"
                className="text-purple-600 hover:text-purple-800 transition-colors"
              >
                {t({ en: 'Explore our research →', ja: '研究内容を見る →' })}
              </Link>
              <Link
                href="/publications"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t({ en: 'Publications', ja: '論文一覧' })}
              </Link>
              <a
                href="mailto:zenas.c.chao@ircn.jp"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t({ en: 'Contact', ja: '連絡先' })}
              </a>
            </div>
          </div>
        </main>

        {/* Subtle hierarchy explanation - appears on scroll */}
        <section className="py-24 px-8 border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">
              {t({ en: 'This page demonstrates', ja: 'このページが示すもの' })}
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {t({ en: 'Hierarchical Predictive Coding', ja: '階層的予測符号化' })}
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                {t({
                  en: 'Move your cursor. The purple dots predict where you\'ll go next. The blue dots appear when predictions are wrong.',
                  ja: 'カーソルを動かしてください。紫の点が次の位置を予測します。青い点は予測が外れたときに現れます。'
                })}
              </p>
              <p className="text-sm text-gray-400">
                {t({
                  en: 'Three levels of prediction hierarchy: immediate, short-term, and long-term. Higher levels are slower to update but predict further ahead.',
                  ja: '3つの予測階層：即時、短期、長期。上位レベルは更新が遅いですが、より先を予測します。'
                })}
              </p>
            </div>

            <div className="flex gap-8 mt-8 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                <span className="text-gray-500">{t({ en: 'Prediction', ja: '予測' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-gray-500">{t({ en: 'Error', ja: '誤差' })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-8 border-t border-gray-100">
          <div className="max-w-3xl mx-auto flex flex-wrap justify-between items-center gap-4 text-sm text-gray-400">
            <div>
              <span>IRCN, University of Tokyo</span>
            </div>
            <div className="flex gap-6">
              <a href="https://ircn.jp" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
                IRCN
              </a>
              <a href="https://www.u-tokyo.ac.jp" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
                UTokyo
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
