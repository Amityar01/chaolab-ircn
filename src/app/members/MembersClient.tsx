'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Member, CategoryConfig } from '@/types/content';

interface MembersClientProps {
  members: Member[];
  categories: CategoryConfig[];
}

export default function MembersClient({ members, categories }: MembersClientProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  // Sort categories by order
  const sortedCategories = [...categories].sort((a, b) => (a.order || 99) - (b.order || 99));

  // Filter members by search
  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = t(member.name).toLowerCase().includes(query);
    const roleMatch = t(member.role).toLowerCase().includes(query);
    const interestMatch = member.research?.some(r => r.toLowerCase().includes(query));
    return nameMatch || roleMatch || interestMatch;
  });

  const membersByCategory = sortedCategories.reduce((acc, cat) => {
    acc[cat.id] = filteredMembers.filter((m) => m.category === cat.id);
    return acc;
  }, {} as Record<string, Member[]>);

  const totalShowing = filteredMembers.length;

  return (
    <div className="members-page">
      <header className="members-header">
        <h1>{t({ en: 'Team', ja: 'メンバー' })}</h1>
        <p className="members-subtitle">
          {t({ en: 'Meet our researchers', ja: '研究者の紹介' })}
        </p>
      </header>

      {/* Search */}
      <div className="search-container">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={t({ en: 'Search members...', ja: 'メンバーを検索...' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="clear-search">×</button>
          )}
        </div>
        {searchQuery && (
          <p className="search-results">
            {totalShowing} {t({ en: 'members found', ja: '名が見つかりました' })}
          </p>
        )}
      </div>

      {/* Members by Category */}
      <div className="categories">
        {sortedCategories.map((category) => {
          const categoryMembers = membersByCategory[category.id];
          if (!categoryMembers || categoryMembers.length === 0) return null;

          return (
            <section key={category.id} className="category-section">
              <h2 className="category-heading">{t(category.label)}</h2>
              <div className="members-grid">
                {categoryMembers.map((member) => (
                  <Link
                    key={member.id}
                    href={`/members/${member.slug}`}
                    className="member-card"
                  >
                    <div className="member-image-container">
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={t(member.name)}
                          width={120}
                          height={120}
                          className="member-image"
                        />
                      ) : (
                        <div className="member-image-placeholder">
                          <span>{t(member.name).charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="member-info">
                      <h3 className="member-name">{t(member.name)}</h3>
                      <p className="member-role">{t(member.role)}</p>
                      {member.research && member.research.length > 0 && (
                        <p className="member-interests">
                          {member.research.slice(0, 2).join(' · ')}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="no-results">
          <p>{t({ en: 'No members found matching your search.', ja: '検索に一致するメンバーが見つかりませんでした。' })}</p>
        </div>
      )}

      <style jsx>{`
        .members-page {
          max-width: 1000px;
          margin: 0 auto;
        }

        .members-header {
          margin-bottom: 2rem;
        }

        .members-header h1 {
          font-size: 2.5rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .members-subtitle {
          color: var(--text-muted);
          font-size: 1.125rem;
        }

        /* Search */
        .search-container {
          margin-bottom: 3rem;
        }

        .search-box {
          position: relative;
          max-width: 400px;
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
        }

        .search-results {
          margin-top: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        /* Categories */
        .category-section {
          margin-bottom: 3rem;
        }

        .category-heading {
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--firefly-glow);
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--card-border);
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        /* Member Card */
        .member-card {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          transition: all 0.2s;
          text-decoration: none;
        }

        .member-card:hover {
          background: var(--card-hover);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }

        .member-image-container {
          flex-shrink: 0;
        }

        .member-image {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid var(--card-border);
        }

        .member-image-placeholder {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--twilight-blue), var(--ambient-glow));
          border: 1px solid var(--card-border);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .member-image-placeholder span {
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .member-info {
          flex: 1;
          min-width: 0;
        }

        .member-name {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .member-role {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .member-interests {
          font-size: 0.75rem;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* No Results */
        .no-results {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-muted);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .members-header h1 {
            font-size: 1.75rem;
          }

          .members-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
