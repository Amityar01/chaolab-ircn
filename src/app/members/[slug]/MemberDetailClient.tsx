'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Member } from '@/types/content';

interface MemberDetailClientProps {
  member: Member;
}

export default function MemberDetailClient({ member }: MemberDetailClientProps) {
  const { t } = useLanguage();

  // Generate initials for avatar placeholder
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="member-detail-page">
      <Link href="/members" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t({ en: 'Back to Members', ja: 'メンバー一覧へ' })}
      </Link>

      {/* Header Section */}
      <header className="member-header">
        <div className="member-photo-wrapper">
          {member.image ? (
            <Image
              src={member.image}
              alt={t(member.name)}
              width={160}
              height={160}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            <div className="avatar-placeholder">
              {getInitials(member.name.en)}
            </div>
          )}
        </div>
        <div className="member-header-info">
          <h1>{t(member.name)}</h1>
          <p className="member-role">{t(member.role)}</p>
          {member.email && (
            <a href={`mailto:${member.email}`} className="member-email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {member.email}
            </a>
          )}
          {member.links && member.links.length > 0 && (
            <div className="member-links">
              {member.links.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="link-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                  {link.label ? t(link.label) : link.type}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Bio Section */}
      {member.bio && (
        <section className="content-section bio-section">
          <h2>{t({ en: 'Biography', ja: '略歴' })}</h2>
          <div className="bio-content">
            <div className="bio-text">{t(member.bio)}</div>
            {member.secondaryImage && (
              <div className="secondary-photo">
                <Image
                  src={member.secondaryImage}
                  alt={t(member.name)}
                  width={280}
                  height={350}
                  style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Research Interests */}
      {member.research && member.research.length > 0 && (
        <section className="content-section">
          <h2>{t({ en: 'Research Interests', ja: '研究分野' })}</h2>
          <div className="research-tags">
            {member.research.map((item, idx) => (
              <span key={idx} className="research-tag">{item}</span>
            ))}
          </div>
        </section>
      )}

      {/* Education & Career Grid */}
      {(member.education || member.career) && (
        <div className="timeline-grid">
          {/* Education */}
          {member.education && member.education.length > 0 && (
            <section className="content-section timeline-section">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                {t({ en: 'Education', ja: '学歴' })}
              </h2>
              <div className="timeline">
                {member.education.map((edu, idx) => (
                  <div key={idx} className="timeline-item">
                    <span className="timeline-year">{edu.year}</span>
                    <div className="timeline-content">
                      <p className="timeline-title">{edu.event}</p>
                      {edu.details && <p className="timeline-details">{edu.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Career */}
          {member.career && member.career.length > 0 && (
            <section className="content-section timeline-section">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
                {t({ en: 'Career', ja: '職歴' })}
              </h2>
              <div className="timeline">
                {member.career.map((job, idx) => (
                  <div key={idx} className="timeline-item">
                    <span className="timeline-year">{job.year}</span>
                    <div className="timeline-content">
                      <p className="timeline-title">{job.position}</p>
                      <p className="timeline-institution">{job.institution}</p>
                      {job.focus && <p className="timeline-details">{job.focus}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <style jsx>{`
        .member-detail-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 2rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--firefly-glow);
        }

        .back-link svg {
          width: 18px;
          height: 18px;
        }

        /* Header */
        .member-header {
          display: flex;
          gap: 2rem;
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--card-border);
        }

        .member-photo-wrapper {
          width: 160px;
          height: 160px;
          border-radius: 16px;
          overflow: hidden;
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          flex-shrink: 0;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: 300;
          color: var(--firefly-glow);
          background: linear-gradient(135deg, rgba(255, 213, 79, 0.1), rgba(167, 139, 250, 0.1));
        }

        .member-header-info {
          flex: 1;
        }

        .member-header-info h1 {
          font-size: 2rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .member-role {
          font-size: 1.1rem;
          color: var(--firefly-glow);
          margin-bottom: 1rem;
        }

        .member-email {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }

        .member-email:hover {
          color: var(--text-primary);
        }

        .member-email svg {
          width: 16px;
          height: 16px;
        }

        .member-links {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        .link-btn:hover {
          background: var(--card-hover);
          border-color: var(--accent-purple);
          color: var(--accent-purple);
        }

        .link-btn svg {
          width: 14px;
          height: 14px;
        }

        /* Content Sections */
        .content-section {
          margin-bottom: 2.5rem;
        }

        .content-section h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
        }

        .content-section h2 svg {
          width: 20px;
          height: 20px;
          color: var(--firefly-glow);
        }

        .bio-content {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }

        .bio-text {
          font-size: 1rem;
          line-height: 1.8;
          color: var(--text-secondary);
          white-space: pre-line;
          flex: 1;
        }

        .secondary-photo {
          flex-shrink: 0;
          width: 280px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--card-border);
        }

        @media (max-width: 768px) {
          .bio-content {
            flex-direction: column;
          }

          .secondary-photo {
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
          }
        }

        /* Research Tags */
        .research-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .research-tag {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, rgba(255, 213, 79, 0.1), rgba(255, 213, 79, 0.05));
          border: 1px solid rgba(255, 213, 79, 0.2);
          border-radius: 100px;
          font-size: 0.85rem;
          color: var(--firefly-glow);
        }

        /* Timeline Grid */
        .timeline-grid {
          display: grid;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .timeline-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .timeline-section {
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .timeline-item {
          display: flex;
          gap: 1rem;
        }

        .timeline-year {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: var(--accent-purple);
          white-space: nowrap;
          min-width: 90px;
          padding-top: 0.2rem;
        }

        .timeline-content {
          flex: 1;
          border-left: 1px solid var(--card-border);
          padding-left: 1rem;
        }

        .timeline-title {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .timeline-institution {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .timeline-details {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-style: italic;
          margin-top: 0.375rem;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .member-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .member-header-info h1 {
            font-size: 1.5rem;
          }

          .member-links {
            justify-content: center;
          }

          .timeline-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .timeline-year {
            min-width: auto;
          }

          .timeline-content {
            border-left: none;
            padding-left: 0;
            border-top: 1px solid var(--card-border);
            padding-top: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
