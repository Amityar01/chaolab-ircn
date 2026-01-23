'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { TeachingCourse } from '@/types/content';

interface TeachingClientProps {
  courses: TeachingCourse[];
}

export default function TeachingClient({ courses }: TeachingClientProps) {
  const { t } = useLanguage();

  return (
    <div className="teaching-page">
      <header className="page-header">
        <span className="overline">{t({ en: 'Education', ja: '教育' })}</span>
        <h1>{t({ en: 'Teaching', ja: '講義' })}</h1>
        <p className="page-intro">
          {t({
            en: 'Courses taught at Kyoto University covering neuroscience, computational methods, and the philosophy of mind.',
            ja: '神経科学、計算手法、心の哲学をカバーする京都大学での講義。'
          })}
        </p>
      </header>

      <div className="courses-grid">
        {courses.map((course) => (
          <article key={course.id} className="course-card">
            <div className="course-header">
              {course.courseCode && (
                <span className="course-code">{course.courseCode}</span>
              )}
              <span className="course-institution">{t(course.institution)}</span>
            </div>

            <h2 className="course-title">{t(course.title)}</h2>

            <p className="course-description">{t(course.description)}</p>

            {course.objectives && course.objectives.length > 0 && (
              <div className="course-objectives">
                <h3>{t({ en: 'Course Objectives', ja: '学習目標' })}</h3>
                <ul>
                  {course.objectives.map((obj, idx) => (
                    <li key={idx}>{t(obj)}</li>
                  ))}
                </ul>
              </div>
            )}

            {course.tags && course.tags.length > 0 && (
              <div className="course-tags">
                {course.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <style jsx>{`
        .teaching-page {
          max-width: 1000px;
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
          margin-bottom: 1rem;
        }

        .page-intro {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 600px;
        }

        .courses-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .course-card {
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.2s;
        }

        .course-card:hover {
          background: var(--card-hover);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .course-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .course-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: var(--accent-purple);
          background: rgba(167, 139, 250, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
        }

        .course-institution {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .course-title {
          font-size: 1.5rem;
          font-weight: 500;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .course-description {
          font-size: 1rem;
          line-height: 1.8;
          color: var(--text-secondary);
          white-space: pre-line;
          margin-bottom: 1.5rem;
        }

        .course-objectives {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .course-objectives h3 {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--firefly-glow);
          margin-bottom: 1rem;
        }

        .course-objectives ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .course-objectives li {
          position: relative;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .course-objectives li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.5rem;
          width: 6px;
          height: 6px;
          background: var(--firefly-glow);
          border-radius: 50%;
          opacity: 0.6;
        }

        .course-objectives li:last-child {
          margin-bottom: 0;
        }

        .course-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          font-size: 0.7rem;
          padding: 0.35rem 0.85rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--card-border);
          color: var(--text-muted);
          border-radius: 100px;
        }

        @media (max-width: 640px) {
          .page-header h1 {
            font-size: 2rem;
          }

          .course-card {
            padding: 1.5rem;
          }

          .course-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
