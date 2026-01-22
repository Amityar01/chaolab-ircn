'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { NewsItem } from '@/types/content';

interface NewsClientProps {
  news: NewsItem[];
}

export default function NewsClient({ news }: NewsClientProps) {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="section-title">{t({ en: 'News', ja: 'ニュース' })}</h1>

      {news.length === 0 ? (
        <p className="text-secondary">{t({ en: 'No news yet.', ja: 'ニュースはまだありません。' })}</p>
      ) : (
        <div className="card">
          {news.map((item) => (
            <div key={item.id} className="news-item">
              <div className="news-date">{item.date}</div>
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
              {item.excerpt && <p className="text-secondary mt-1">{t(item.excerpt)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
