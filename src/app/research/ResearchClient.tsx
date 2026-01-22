'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { ResearchTheme } from '@/types/content';

interface ResearchClientProps {
  themes: ResearchTheme[];
}

export default function ResearchClient({ themes }: ResearchClientProps) {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="section-title">{t({ en: 'Research', ja: '研究' })}</h1>

      {themes.length === 0 ? (
        <p className="text-secondary">{t({ en: 'Research themes coming soon.', ja: '研究テーマは準備中です。' })}</p>
      ) : (
        <div className="grid grid-2">
          {themes.map((theme) => (
            <div key={theme.id} className="card">
              <h2>{t(theme.title)}</h2>
              <p className="text-secondary">{t(theme.description)}</p>
              {theme.tags && theme.tags.length > 0 && (
                <div className="mt-2" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {theme.tags.map((tag) => (
                    <span key={tag} className="news-category">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
