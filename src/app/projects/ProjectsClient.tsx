'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { Project } from '@/types/content';

interface ProjectsClientProps {
  projects: Project[];
}

export default function ProjectsClient({ projects }: ProjectsClientProps) {
  const { t } = useLanguage();

  return (
    <div className="projects-page">
      <header className="page-header">
        <span className="overline">{t({ en: 'Collaborations', ja: 'コラボレーション' })}</span>
        <h1>{t({ en: 'Projects', ja: 'プロジェクト' })}</h1>
      </header>

      <div className="projects-list">
        {projects.map((project) => (
          <article
            key={project.id}
            className="project-card"
            style={{ '--accent': project.accentColor || 'var(--firefly-glow)' } as React.CSSProperties}
          >
            {project.collaboration && (
              <div className="collaboration-badge">
                {t(project.collaboration)}
              </div>
            )}

            <h2 className="project-title">{t(project.title)}</h2>

            {project.subtitle && (
              <p className="project-subtitle">{t(project.subtitle)}</p>
            )}

            <div className="project-description">
              {t(project.description)}
            </div>

            {project.goals && project.goals.length > 0 && (
              <div className="project-goals">
                <h3>{t({ en: 'Goals', ja: '目標' })}</h3>
                <ul>
                  {project.goals.map((goal, idx) => (
                    <li key={idx}>{t(goal)}</li>
                  ))}
                </ul>
              </div>
            )}

            {project.partners && project.partners.length > 0 && (
              <div className="project-partners">
                <h3>{t({ en: 'Partners', ja: 'パートナー' })}</h3>
                <div className="partners-list">
                  {project.partners.map((partner, idx) => (
                    <a
                      key={idx}
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="partner-link"
                    >
                      {t(partner.name)}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {project.registerUrl && (
              <a href={project.registerUrl} className="register-btn" target="_blank" rel="noopener noreferrer">
                {t({ en: 'Register', ja: '登録する' })}
              </a>
            )}
          </article>
        ))}
      </div>

      <style jsx>{`
        .projects-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 3rem;
        }

        .overline {
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--firefly-glow);
          margin-bottom: 0.5rem;
        }

        .page-header h1 {
          font-size: 3rem;
          font-weight: 400;
          letter-spacing: -0.02em;
        }

        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .project-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 2.5rem;
          transition: all 0.3s;
        }

        .project-card:hover {
          border-color: var(--accent);
          box-shadow: 0 0 40px rgba(255, 213, 79, 0.1);
        }

        .collaboration-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent);
          background: rgba(255, 213, 79, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 100px;
          margin-bottom: 1.5rem;
        }

        .project-title {
          font-size: 2.5rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .project-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .project-description {
          font-size: 1.1rem;
          line-height: 1.8;
          color: var(--text-secondary);
          white-space: pre-line;
          margin-bottom: 2rem;
        }

        .project-goals {
          margin-bottom: 2rem;
        }

        .project-goals h3,
        .project-partners h3 {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .project-goals ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .project-goals li {
          position: relative;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .project-goals li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.6rem;
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 50%;
          opacity: 0.7;
        }

        .project-partners {
          margin-bottom: 2rem;
        }

        .partners-list {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .partner-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 10px;
          font-size: 0.9rem;
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        .partner-link:hover {
          background: var(--card-hover);
          border-color: var(--accent);
          color: var(--accent);
        }

        .partner-link svg {
          width: 14px;
          height: 14px;
          opacity: 0.6;
        }

        .register-btn {
          display: inline-block;
          padding: 1rem 2rem;
          background: var(--accent);
          color: var(--deep-space);
          font-weight: 600;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .register-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 213, 79, 0.3);
        }

        @media (max-width: 640px) {
          .page-header h1 {
            font-size: 2rem;
          }

          .project-card {
            padding: 1.5rem;
          }

          .project-title {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}
