'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { Publication } from '@/types/content';

interface PublicationsClientProps {
  publications: Publication[];
}

export default function PublicationsClient({ publications }: PublicationsClientProps) {
  const { t } = useLanguage();

  // Group by year
  const pubsByYear = publications.reduce((acc, pub) => {
    if (!acc[pub.year]) acc[pub.year] = [];
    acc[pub.year].push(pub);
    return acc;
  }, {} as Record<number, Publication[]>);

  const years = Object.keys(pubsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div>
      <h1 className="section-title">{t({ en: 'Publications', ja: '業績' })}</h1>

      {publications.length === 0 ? (
        <p className="text-secondary">{t({ en: 'No publications yet.', ja: 'まだ業績がありません。' })}</p>
      ) : (
        years.map((year) => (
          <section key={year} className="section">
            <h2>{year}</h2>
            <div className="card">
              {pubsByYear[year].map((pub) => (
                <div key={pub.id} className="pub-item">
                  <div className="pub-title">
                    {pub.doi ? (
                      <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer">
                        {pub.title}
                      </a>
                    ) : (
                      pub.title
                    )}
                  </div>
                  <div className="pub-authors">{pub.authors.join(', ')}</div>
                  {pub.journal && <div className="pub-journal">{pub.journal}</div>}
                  {pub.conference && <div className="pub-journal">{pub.conference}</div>}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
