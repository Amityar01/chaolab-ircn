'use client';

import Link from 'next/link';
import { Brain, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { HomepageSettings, NewsItem, ResearchTheme } from '@/types/content';

interface HomeClientProps {
  settings: HomepageSettings | null;
  news: NewsItem[];
  themes: ResearchTheme[];
}

export default function HomeClient({ settings, news, themes }: HomeClientProps) {
  const { t } = useLanguage();

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        {/* Animated background orbs */}
        <div className="hero-orb hero-orb--blue" />
        <div className="hero-orb hero-orb--amber" />

        <span className="hero-eyebrow">
          {t({ en: 'IRCN · University of Tokyo', ja: '東京大学 · IRCN' })}
        </span>

        <h1>
          {t({
            en: <>The <em>Chao</em> Lab</>,
            ja: <><em>Chao</em> 研究室</>
          })}
        </h1>

        <p className="hero-tagline">
          {t({
            en: 'Investigating predictive coding in the brain and its applications to understanding and augmenting human creativity',
            ja: '脳の予測符号化を研究し、人間の創造性の理解と増強への応用を探求'
          })}
        </p>

        <div className="hero-actions">
          <Link href="/research" className="btn btn-primary">
            {t({ en: 'Explore Research', ja: '研究内容' })}
            <ArrowRight size={16} />
          </Link>
          <Link href="/members" className="btn btn-secondary">
            {t({ en: 'Meet the Team', ja: 'メンバー紹介' })}
          </Link>
        </div>
      </section>

      {/* Research Pillars - Split Theme Display */}
      <section className="section">
        <div className="section-header">
          <span className="section-label">
            {t({ en: 'Research Focus', ja: '研究の焦点' })}
          </span>
          <h2 className="section-title">
            {t({ en: 'Two Pillars, One Vision', ja: '二つの柱、一つのビジョン' })}
          </h2>
          <p className="section-description">
            {t({
              en: 'Our research bridges fundamental neuroscience with real-world applications, exploring how the brain predicts and creates.',
              ja: '基礎神経科学と実世界への応用を橋渡しし、脳がどのように予測し創造するかを探求します。'
            })}
          </p>
        </div>

        <div className="research-grid research-grid--split">
          {/* Prediction Column */}
          <div className="research-column research-column--prediction">
            <div className="research-column-header">
              <Brain size={32} style={{ color: 'var(--prediction-purple)', marginBottom: '0.5rem' }} />
              <h3>{t({ en: 'Predictive Coding', ja: '予測符号化' })}</h3>
              <p>{t({ en: 'Understanding how the brain anticipates', ja: '脳がどのように予測するかを理解する' })}</p>
            </div>

            <div className="card research-card research-card--prediction">
              <span className="theme-label theme-label--prediction">
                {t({ en: 'Neural Circuits', ja: '神経回路' })}
              </span>
              <h3>{t({ en: 'Prediction Mechanisms', ja: '予測メカニズム' })}</h3>
              <p className="text-secondary">
                {t({
                  en: 'Mapping the microcircuits and macrocircuits essential to predictive coding across hierarchical levels.',
                  ja: '階層レベルにわたる予測符号化に不可欠な微小回路と巨視的回路のマッピング。'
                })}
              </p>
            </div>

            <div className="card research-card research-card--prediction">
              <span className="theme-label theme-label--prediction">
                {t({ en: 'Clinical', ja: '臨床' })}
              </span>
              <h3>{t({ en: 'Psychiatric Markers', ja: '精神医学的マーカー' })}</h3>
              <p className="text-secondary">
                {t({
                  en: 'Identifying neural signatures of prediction anomalies in autism and other conditions.',
                  ja: '自閉症などの状態における予測異常の神経シグネチャの特定。'
                })}
              </p>
            </div>
          </div>

          {/* Connector */}
          <div className="theme-connector">
            <div className="theme-connector-icon">
              <Sparkles size={20} />
            </div>
          </div>

          {/* Creativity Column */}
          <div className="research-column research-column--creativity">
            <div className="research-column-header">
              <Lightbulb size={32} style={{ color: 'var(--creativity-blue)', marginBottom: '0.5rem' }} />
              <h3>{t({ en: 'Creativity', ja: '創造性' })}</h3>
              <p>{t({ en: 'Augmenting human creative potential', ja: '人間の創造的可能性を増強する' })}</p>
            </div>

            <div className="card research-card research-card--creativity">
              <span className="theme-label theme-label--creativity">
                {t({ en: 'With Daikin', ja: 'ダイキンとの共同' })}
              </span>
              <h3>{t({ en: 'Neural Basis of Creativity', ja: '創造性の神経基盤' })}</h3>
              <p className="text-secondary">
                {t({
                  en: 'Exploring how predictive coding relates to the brain\'s capacity to generate novel ideas.',
                  ja: '予測符号化が脳の新しいアイデアを生み出す能力とどのように関連するかを探求。'
                })}
              </p>
            </div>

            <div className="card research-card research-card--creativity">
              <span className="theme-label theme-label--creativity">
                {t({ en: 'Applied', ja: '応用' })}
              </span>
              <h3>{t({ en: 'Creativity Augmentation', ja: '創造性の増強' })}</h3>
              <p className="text-secondary">
                {t({
                  en: 'Developing closed-loop systems to enhance creative problem-solving in real-world applications.',
                  ja: '実世界での創造的問題解決を強化するクローズドループシステムの開発。'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Interaction Card - Where both meet */}
        <div className="mt-8">
          <div className="card research-card research-card--interaction" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <span className="theme-label theme-label--interaction">
              {t({ en: 'Intersection', ja: '交差点' })}
            </span>
            <h3>{t({ en: 'Where Prediction Meets Creation', ja: '予測と創造が出会う場所' })}</h3>
            <p className="text-secondary" style={{ margin: '0 auto' }}>
              {t({
                en: 'We believe creativity emerges from the brain\'s predictive machinery—generating novel predictions that break from expectation.',
                ja: '創造性は脳の予測機構から生まれると考えています—期待を打ち破る新しい予測を生成します。'
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Latest News */}
      {news.length > 0 && (
        <section className="section">
          <div className="section-header">
            <span className="section-label">
              {t({ en: 'Updates', ja: '更新情報' })}
            </span>
            <h2 className="section-title">
              {t({ en: 'Latest News', ja: '最新ニュース' })}
            </h2>
          </div>

          <div className="card">
            {news.map((item) => (
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
                    <span className="news-category">{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <Link href="/news" className="btn btn-secondary">
              {t({ en: 'View All News', ja: 'すべてのニュース' })}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* Affiliations */}
      <section className="section">
        <div className="stats-row">
          <div className="stat-item">
            <a href="https://ircn.jp" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div className="stat-label">{t({ en: 'Part of', ja: '所属' })}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 500, marginTop: '0.5rem' }}>IRCN</div>
              <div className="stat-label" style={{ marginTop: '0.25rem' }}>{t({ en: 'University of Tokyo', ja: '東京大学' })}</div>
            </a>
          </div>
          <div className="stat-item">
            <div className="stat-label">{t({ en: 'Collaboration', ja: '共同研究' })}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 500, marginTop: '0.5rem', color: 'var(--creativity-blue)' }}>Daikin</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>{t({ en: 'Creativity Research', ja: '創造性研究' })}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
