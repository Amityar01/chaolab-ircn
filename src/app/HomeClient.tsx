'use client';

import Link from 'next/link';
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
        <h1>{t(settings?.labName || { en: 'Lab Name', ja: 'ラボ名' })}</h1>
        <p>{t(settings?.tagline || { en: 'Research laboratory tagline goes here', ja: '研究室のタグライン' })}</p>
        <div className="mt-4">
          <Link href="/research" className="btn btn-primary">
            {t({ en: 'Our Research', ja: '研究内容' })}
          </Link>
        </div>
      </section>

      {/* Research Themes */}
      {themes.length > 0 && (
        <section className="section">
          <h2 className="section-title">{t({ en: 'Research Areas', ja: '研究分野' })}</h2>
          <div className="grid grid-3">
            {themes.map((theme) => (
              <div key={theme.id} className="card">
                <h3>{t(theme.title)}</h3>
                <p className="text-secondary">{t(theme.description)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest News */}
      {news.length > 0 && (
        <section className="section">
          <h2 className="section-title">{t({ en: 'Latest News', ja: '最新情報' })}</h2>
          <div className="card">
            {news.map((item) => (
              <div key={item.id} className="news-item">
                <div className="news-date">{item.date}</div>
                <div className="news-title">
                  {item.link ? (
                    <a href={item.link}>{t(item.title)}</a>
                  ) : (
                    t(item.title)
                  )}
                  <span className="news-category">{item.category}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <Link href="/news" className="btn btn-secondary">
              {t({ en: 'View All News', ja: 'すべてのニュース' })}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
