'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Project } from '@/types/content';

interface ProjectsClientProps {
  projects: Project[];
}

export default function ProjectsClient({ projects }: ProjectsClientProps) {
  const { t } = useLanguage();

  // For now, just show the first project as the main feature
  const project = projects[0];

  if (!project) {
    return <div>No projects found</div>;
  }

  return (
    <div className="project-page">
      {/* Hero Section */}
      <header className="hero-section">
        {project.collaboration && (
          <div className="collaboration-badge">
            {t(project.collaboration)}
          </div>
        )}
        <h1 className="project-title">{t(project.title)}</h1>
        {project.subtitle && (
          <p className="project-subtitle">{t(project.subtitle)}</p>
        )}
        {project.introduction && (
          <p className="project-intro">{t(project.introduction)}</p>
        )}
      </header>

      {/* Graph/Hero Image */}
      {project.heroImage && (
        <div className="hero-image-section">
          <div className="section-label">
            {t({ en: 'Creativity in problem-solving', ja: '問題解決における創造性' })}
          </div>
          <div className="hero-image-wrapper">
            <Image
              src={project.heroImage}
              alt="Creativity in problem-solving"
              width={800}
              height={534}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>
      )}

      {/* Vision Section */}
      {project.vision && (
        <section className="content-section vision-section">
          <h2>{t({ en: 'Vision', ja: 'ビジョン' })}</h2>
          <p className="vision-text">{t(project.vision)}</p>
        </section>
      )}

      {/* Mission Section */}
      {project.mission && (
        <section className="content-section mission-section">
          <div className="mission-content">
            <h2>{t(project.mission.title)}</h2>
            <p className="mission-description">{t(project.mission.description)}</p>
            <ul className="mission-points">
              {project.mission.points.map((point, idx) => (
                <li key={idx}>
                  <span className="point-number">{idx + 1}</span>
                  {t(point)}
                </li>
              ))}
            </ul>
          </div>
          <div className="mission-image">
            <Image
              src="/uploads/neurocreativity-mission.png"
              alt="Mission infographic"
              width={600}
              height={400}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </section>
      )}

      {/* Features Section */}
      {project.features && project.features.length > 0 && (
        <section className="content-section features-section">
          <h2>{t({ en: 'How It Works', ja: '仕組み' })}</h2>
          <div className="features-grid">
            {project.features.map((feature, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon">
                  {idx === 0 && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  {idx === 1 && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                  {idx === 2 && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                <h3>{t(feature.title)}</h3>
                <p>{t(feature.description)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Policies Section */}
      {project.policies && project.policies.length > 0 && (
        <section className="content-section policies-section">
          <h2>{t({ en: 'Participant Information', ja: '参加者情報' })}</h2>
          <div className="policies-grid">
            {project.policies.map((policy, idx) => (
              <div key={idx} className="policy-card">
                <h3>{t(policy.title)}</h3>
                <p>{t(policy.description)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Partners & CTA */}
      <section className="content-section cta-section">
        {project.partners && project.partners.length > 0 && (
          <div className="partners">
            <div className="partner-logos">
              <Image src="/uploads/utokyo-logo.png" alt="University of Tokyo" width={200} height={52} />
              <Image src="/uploads/ircn-logo.png" alt="IRCN" width={180} height={52} />
            </div>
          </div>
        )}
        {project.registerUrl && (
          <a href={project.registerUrl} className="register-btn" target="_blank" rel="noopener noreferrer">
            {t({ en: 'Register to Participate', ja: '参加登録' })}
          </a>
        )}
      </section>

      <style jsx>{`
        .project-page {
          max-width: 1000px;
          margin: 0 auto;
        }

        /* Hero Section */
        .hero-section {
          text-align: center;
          margin-bottom: 4rem;
          padding-bottom: 3rem;
          border-bottom: 1px solid var(--card-border);
        }

        .collaboration-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--firefly-glow);
          background: rgba(255, 213, 79, 0.1);
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
          margin-bottom: 1.5rem;
        }

        .project-title {
          font-size: 3.5rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--firefly-glow) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .project-subtitle {
          font-size: 1.5rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .project-intro {
          font-size: 1.15rem;
          line-height: 1.8;
          color: var(--text-secondary);
          max-width: 700px;
          margin: 0 auto;
        }

        /* Hero Image */
        .hero-image-section {
          margin-bottom: 4rem;
        }

        .section-label {
          text-align: center;
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
        }

        .hero-image-wrapper {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--card-border);
          background: #f5f5f5;
        }

        /* Content Sections */
        .content-section {
          margin-bottom: 4rem;
        }

        .content-section h2 {
          font-size: 2rem;
          font-weight: 500;
          text-align: center;
          margin-bottom: 2rem;
        }

        /* Vision */
        .vision-text {
          font-size: 1.15rem;
          line-height: 2;
          color: var(--text-secondary);
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        /* Mission */
        .mission-section {
          display: grid;
          gap: 3rem;
          align-items: center;
        }

        @media (min-width: 768px) {
          .mission-section {
            grid-template-columns: 1fr 1fr;
          }
        }

        .mission-description {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .mission-points {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .mission-points li {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .point-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--firefly-glow);
          color: var(--deep-space);
          border-radius: 50%;
          font-size: 0.85rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .mission-image {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--card-border);
          background: #f5f5f5;
        }

        /* Features */
        .features-grid {
          display: grid;
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-card {
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 1rem;
          color: var(--firefly-glow);
        }

        .feature-icon svg {
          width: 100%;
          height: 100%;
        }

        .feature-card h3 {
          font-size: 1.1rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .feature-card p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* Policies */
        .policies-grid {
          display: grid;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .policies-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 900px) {
          .policies-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .policy-card {
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .policy-card h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--firefly-glow);
          margin-bottom: 0.75rem;
        }

        .policy-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* CTA Section */
        .cta-section {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid var(--card-border);
        }

        .partner-logos {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 3rem;
          margin-bottom: 2rem;
          filter: brightness(0) invert(0.7);
        }

        .register-btn {
          display: inline-block;
          padding: 1rem 3rem;
          background: var(--firefly-glow);
          color: var(--deep-space);
          font-weight: 600;
          font-size: 1.1rem;
          border-radius: 100px;
          transition: all 0.2s;
        }

        .register-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 213, 79, 0.3);
        }

        @media (max-width: 640px) {
          .project-title {
            font-size: 2rem;
          }

          .project-subtitle {
            font-size: 1.1rem;
          }

          .content-section h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
