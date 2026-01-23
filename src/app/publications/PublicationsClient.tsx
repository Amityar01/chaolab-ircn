'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Publication } from '@/types/content';

interface PublicationsClientProps {
  publications: Publication[];
}

export default function PublicationsClient({ publications }: PublicationsClientProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Get unique years and types
  const years = useMemo(() => {
    const uniqueYears = [...new Set(publications.map(p => p.year))].sort((a, b) => b - a);
    return uniqueYears;
  }, [publications]);

  const types = useMemo(() => {
    const uniqueTypes = [...new Set(publications.map(p => p.type))];
    return uniqueTypes;
  }, [publications]);

  const typeLabels: Record<string, { en: string; ja: string }> = {
    journal: { en: 'Journal', ja: '論文' },
    conference: { en: 'Conference', ja: '学会' },
    'book-chapter': { en: 'Book/Chapter', ja: '書籍' },
    preprint: { en: 'Preprint', ja: 'プレプリント' },
    thesis: { en: 'Thesis', ja: '学位論文' },
  };

  // Filter publications
  const filteredPubs = useMemo(() => {
    return publications.filter(pub => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = pub.title.toLowerCase().includes(query);
        const matchesAuthors = pub.authors.some(a => a.toLowerCase().includes(query));
        const matchesJournal = pub.journal?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAuthors && !matchesJournal) return false;
      }

      // Year filter
      if (selectedYear !== 'all' && pub.year !== parseInt(selectedYear)) return false;

      // Type filter
      if (selectedType !== 'all' && pub.type !== selectedType) return false;

      return true;
    });
  }, [publications, searchQuery, selectedYear, selectedType]);

  // Group by year
  const pubsByYear = useMemo(() => {
    return filteredPubs.reduce((acc, pub) => {
      if (!acc[pub.year]) acc[pub.year] = [];
      acc[pub.year].push(pub);
      return acc;
    }, {} as Record<number, Publication[]>);
  }, [filteredPubs]);

  const sortedYears = Object.keys(pubsByYear).map(Number).sort((a, b) => b - a);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedYear('all');
    setSelectedType('all');
  };

  const hasActiveFilters = searchQuery || selectedYear !== 'all' || selectedType !== 'all';

  return (
    <div className="publications-page">
      {/* Header */}
      <header className="pub-header">
        <h1>{t({ en: 'Publications', ja: '業績' })}</h1>
        <p className="pub-count">
          {filteredPubs.length} {t({ en: 'publications', ja: '件' })}
          {hasActiveFilters && (
            <button onClick={clearFilters} className="clear-filters">
              {t({ en: 'Clear filters', ja: 'フィルターをクリア' })}
            </button>
          )}
        </p>
      </header>

      {/* Search and Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={t({ en: 'Search by title, author, journal...', ja: 'タイトル、著者、雑誌で検索...' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="clear-search">×</button>
          )}
        </div>

        <div className="filter-group">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t({ en: 'All Years', ja: '全年' })}</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t({ en: 'All Types', ja: '全種類' })}</option>
            {types.map(type => (
              <option key={type} value={type}>
                {typeLabels[type] ? t(typeLabels[type]) : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Publications List */}
      {filteredPubs.length === 0 ? (
        <div className="no-results">
          <p>{t({ en: 'No publications found matching your criteria.', ja: '条件に一致する業績が見つかりませんでした。' })}</p>
        </div>
      ) : (
        <div className="publications-list">
          {sortedYears.map(year => (
            <section key={year} className="year-section">
              <h2 className="year-heading">{year}</h2>
              <div className="year-publications">
                {pubsByYear[year].map((pub, index) => (
                  <article key={pub.id} className="pub-card">
                    <div className="pub-type-badge">
                      {typeLabels[pub.type] ? t(typeLabels[pub.type]) : pub.type}
                    </div>
                    <h3 className="pub-title">
                      {pub.doi ? (
                        <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer">
                          {pub.title}
                        </a>
                      ) : (
                        pub.title
                      )}
                    </h3>
                    <p className="pub-authors">{pub.authors.join(', ')}</p>
                    <p className="pub-venue">
                      {pub.journal || pub.conference}
                      {pub.volume && ` ${pub.volume}`}
                      {pub.pages && `, ${pub.pages}`}
                    </p>
                    {pub.doi && (
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pub-doi"
                      >
                        {pub.doi}
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <style jsx>{`
        .publications-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .pub-header {
          margin-bottom: 2rem;
        }

        .pub-header h1 {
          font-size: 2.5rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .pub-count {
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .clear-filters {
          background: none;
          border: 1px solid var(--card-border);
          color: var(--text-muted);
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-filters:hover {
          border-color: var(--firefly-glow);
          color: var(--firefly-glow);
        }

        /* Filters */
        .filters-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 280px;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 2.5rem 0.875rem 3rem;
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--firefly-glow);
          box-shadow: 0 0 0 3px rgba(255, 213, 79, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .clear-search:hover {
          color: var(--text-primary);
        }

        .filter-group {
          display: flex;
          gap: 0.75rem;
        }

        .filter-select {
          padding: 0.875rem 2rem 0.875rem 1rem;
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 0.9rem;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          transition: all 0.2s;
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--firefly-glow);
        }

        .filter-select option {
          background: var(--deep-space);
          color: var(--text-primary);
        }

        /* No Results */
        .no-results {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-muted);
        }

        /* Publications List */
        .year-section {
          margin-bottom: 3rem;
        }

        .year-heading {
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--firefly-glow);
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--card-border);
        }

        .year-publications {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .pub-card {
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .pub-card:hover {
          background: var(--card-hover);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .pub-type-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--firefly-glow);
          background: rgba(255, 213, 79, 0.1);
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }

        .pub-title {
          font-size: 1.1rem;
          font-weight: 500;
          line-height: 1.4;
          margin-bottom: 0.5rem;
        }

        .pub-title a {
          color: var(--text-primary);
          transition: color 0.2s;
        }

        .pub-title a:hover {
          color: var(--accent-purple);
        }

        .pub-authors {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 0.375rem;
        }

        .pub-venue {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-style: italic;
          margin-bottom: 0.5rem;
        }

        .pub-doi {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: var(--accent-purple);
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .pub-doi:hover {
          opacity: 1;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .filters-bar {
            flex-direction: column;
          }

          .search-box {
            min-width: 100%;
          }

          .filter-group {
            width: 100%;
          }

          .filter-select {
            flex: 1;
          }

          .pub-header h1 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}
