'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import { Brain, Lightbulb, ArrowRight, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePredictiveSystem } from '@/hooks/usePredictiveSystem';
import NeuralNetworkBackground from '@/components/NeuralNetworkBackground';
import type { HomepageSettings, NewsItem, ResearchTheme } from '@/types/content';

// Lazy load the heavy 3D component
const CorticalSurface = lazy(() => import('@/components/CorticalSurface'));

interface HomeClientProps {
  settings: HomepageSettings | null;
  news: NewsItem[];
  themes: ResearchTheme[];
}

export default function HomeClient({ settings, news, themes }: HomeClientProps) {
  const { t } = useLanguage();
  const { mouse, omission, scroll, surpriseLevel, isHighError } = usePredictiveSystem();
  const [mounted, setMounted] = useState(false);
  const [showIndicator, setShowIndicator] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Hide indicator after initial demonstration
    const timer = setTimeout(() => setShowIndicator(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {/* Neural Network Background - always visible */}
      {mounted && (
        <NeuralNetworkBackground
          mousePos={mouse.mousePos}
          predictionError={mouse.predictionError}
          isOmission={omission.isOmission}
        />
      )}

      {/* Noise overlay for texture */}
      <div className="noise-overlay" />

      {/* Hero Section with 3D Brain */}
      <section className="hero">
        {/* 3D Cortical Surface */}
        {mounted && (
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="activity-indicator" style={{ width: 40, height: 40 }} />
            </div>
          }>
            <CorticalSurface
              mousePos={mouse.mousePos}
              predictedPos={mouse.predictedPos}
              predictionError={mouse.predictionError}
              isOmission={omission.isOmission}
              omissionLocation={omission.omissionLocation}
            />
          </Suspense>
        )}

        {/* Hero Content */}
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.p
            className="hero-tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {t({ en: 'IRCN · University of Tokyo', ja: '東京大学 · IRCN' })}
          </motion.p>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {t({ en: 'The', ja: '' })} <em>Chao</em> {t({ en: 'Lab', ja: '研究室' })}
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            {t({
              en: 'Predictive & Creative Brain',
              ja: '予測的で創造的な脳'
            })}
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <Link href="/research" className="btn btn-primary">
              {t({ en: 'Explore Research', ja: '研究内容' })}
              <ArrowRight size={16} />
            </Link>
            <Link href="/members" className="btn btn-secondary">
              {t({ en: 'Meet the Team', ja: 'メンバー紹介' })}
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
            {t({ en: 'Scroll to explore', ja: 'スクロールして探索' })}
          </span>
          <motion.div
            className="w-px h-8 bg-gradient-to-b from-[var(--prediction-purple)] to-transparent"
            animate={{ scaleY: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </section>

      {/* Prediction System Indicator */}
      {mounted && showIndicator && (
        <motion.div
          className="prediction-indicator"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0.7, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          onMouseEnter={() => setShowIndicator(true)}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity size={12} className="text-[var(--prediction-purple)]" />
            <span className="label">Prediction System</span>
          </div>
          <div className="flex justify-between">
            <span className="label">Error:</span>
            <span className={mouse.predictionError > 50 ? 'error' : 'value'}>
              {mouse.predictionError.toFixed(0)}px
            </span>
          </div>
          <div className="flex justify-between">
            <span className="label">Speed:</span>
            <span className="value">{mouse.speed.toFixed(0)}px/s</span>
          </div>
          <div className="flex justify-between">
            <span className="label">Omission:</span>
            <span className={omission.isOmission ? 'omission' : 'value'}>
              {omission.isOmission ? 'DETECTED' : 'none'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Research Section */}
      <section className="section container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-sm font-mono text-[var(--prediction-light)] tracking-widest uppercase mb-4">
            {t({ en: 'Research Focus', ja: '研究の焦点' })}
          </p>
          <h2 className="text-gradient mb-4">
            {t({ en: 'Two Pillars, One Vision', ja: '二つの柱、一つのビジョン' })}
          </h2>
          <p className="text-secondary max-w-2xl mx-auto">
            {t({
              en: 'Our research bridges fundamental neuroscience with real-world applications, exploring how the brain predicts and creates.',
              ja: '基礎神経科学と実世界への応用を橋渡しし、脳がどのように予測し創造するかを探求します。'
            })}
          </p>
        </motion.div>

        {/* Research Pillars Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Prediction Pillar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-[var(--prediction-glow)]">
                <Brain size={28} className="text-[var(--prediction-purple)]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--prediction-light)]">
                  {t({ en: 'Predictive Coding', ja: '予測符号化' })}
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {t({ en: 'Understanding how the brain anticipates', ja: '脳がどのように予測するかを理解する' })}
                </p>
              </div>
            </div>

            <div className="card theme-prediction">
              <span className="theme-label theme-label--prediction">
                {t({ en: 'Neural Circuits', ja: '神経回路' })}
              </span>
              <h3>{t({ en: 'Prediction Mechanisms', ja: '予測メカニズム' })}</h3>
              <p className="text-secondary text-sm mt-2">
                {t({
                  en: 'Mapping the microcircuits and macrocircuits essential to predictive coding across hierarchical levels.',
                  ja: '階層レベルにわたる予測符号化に不可欠な微小回路と巨視的回路のマッピング。'
                })}
              </p>
            </div>

            <div className="card theme-prediction">
              <span className="theme-label theme-label--prediction">
                {t({ en: 'Clinical', ja: '臨床' })}
              </span>
              <h3>{t({ en: 'Psychiatric Markers', ja: '精神医学的マーカー' })}</h3>
              <p className="text-secondary text-sm mt-2">
                {t({
                  en: 'Identifying neural signatures of prediction anomalies in autism and other conditions.',
                  ja: '自閉症などの状態における予測異常の神経シグネチャの特定。'
                })}
              </p>
            </div>
          </motion.div>

          {/* Creativity Pillar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-[var(--creativity-glow)]">
                <Lightbulb size={28} className="text-[var(--creativity-blue)]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--creativity-light)]">
                  {t({ en: 'Creativity', ja: '創造性' })}
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {t({ en: 'Augmenting human creative potential', ja: '人間の創造的可能性を増強する' })}
                </p>
              </div>
            </div>

            <div className="card card-creativity theme-creativity">
              <span className="theme-label theme-label--creativity">
                {t({ en: 'With Daikin', ja: 'ダイキンとの共同' })}
              </span>
              <h3>{t({ en: 'Neural Basis of Creativity', ja: '創造性の神経基盤' })}</h3>
              <p className="text-secondary text-sm mt-2">
                {t({
                  en: "Exploring how predictive coding relates to the brain's capacity to generate novel ideas.",
                  ja: '予測符号化が脳の新しいアイデアを生み出す能力とどのように関連するかを探求。'
                })}
              </p>
            </div>

            <div className="card card-creativity theme-creativity">
              <span className="theme-label theme-label--creativity">
                {t({ en: 'Applied', ja: '応用' })}
              </span>
              <h3>{t({ en: 'Creativity Augmentation', ja: '創造性の増強' })}</h3>
              <p className="text-secondary text-sm mt-2">
                {t({
                  en: 'Developing closed-loop systems to enhance creative problem-solving in real-world applications.',
                  ja: '実世界での創造的問題解決を強化するクローズドループシステムの開発。'
                })}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Intersection Card */}
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="card text-center p-8" style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 151, 224, 0.1))',
            borderImage: 'linear-gradient(135deg, var(--prediction-purple), var(--creativity-blue)) 1'
          }}>
            <Sparkles size={24} className="mx-auto mb-4 text-[var(--prediction-light)]" />
            <h3 className="text-gradient mb-3">
              {t({ en: 'Where Prediction Meets Creation', ja: '予測と創造が出会う場所' })}
            </h3>
            <p className="text-secondary text-sm max-w-md mx-auto">
              {t({
                en: "We believe creativity emerges from the brain's predictive machinery—generating novel predictions that break from expectation.",
                ja: '創造性は脳の予測機構から生まれると考えています—期待を打ち破る新しい予測を生成します。'
              })}
            </p>
          </div>
        </motion.div>
      </section>

      {/* Latest News */}
      {news.length > 0 && (
        <section className="section container">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-mono text-[var(--creativity-blue)] tracking-widest uppercase mb-4">
              {t({ en: 'Updates', ja: '更新情報' })}
            </p>
            <h2>{t({ en: 'Latest News', ja: '最新ニュース' })}</h2>
          </motion.div>

          <motion.div
            className="card max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {news.slice(0, 3).map((item, index) => (
              <div key={item.id} className="news-item">
                <div className="news-date">{item.date}</div>
                <div className="news-content">
                  <div className="news-title">
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        {t(item.title)}
                      </a>
                    ) : (
                      t(item.title)
                    )}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href="/news" className="btn btn-secondary">
              {t({ en: 'View All News', ja: 'すべてのニュース' })}
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </section>
      )}

      {/* Affiliations */}
      <section className="section container">
        <motion.div
          className="flex justify-center items-center gap-16 flex-wrap py-8 border-t border-b border-[var(--border-subtle)]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <a
            href="https://ircn.jp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center group"
          >
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">
              {t({ en: 'Part of', ja: '所属' })}
            </p>
            <p className="text-xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--prediction-light)] transition-colors">
              IRCN
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {t({ en: 'University of Tokyo', ja: '東京大学' })}
            </p>
          </a>

          <div className="text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">
              {t({ en: 'Collaboration', ja: '共同研究' })}
            </p>
            <p className="text-xl font-semibold text-[var(--creativity-blue)]">
              Daikin
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {t({ en: 'Creativity Research', ja: '創造性研究' })}
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
