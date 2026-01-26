'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { BilingualText } from '@/types/content';

interface EmptyStateProps {
  title?: BilingualText;
  message?: BilingualText;
  icon?: React.ReactNode;
}

const defaultTitles: Record<string, BilingualText> = {
  publications: { en: 'No publications yet', ja: 'まだ論文がありません' },
  members: { en: 'No team members listed', ja: 'メンバー情報がありません' },
  news: { en: 'No news updates', ja: 'お知らせはありません' },
  research: { en: 'Research themes coming soon', ja: '研究テーマは近日公開予定です' },
  projects: { en: 'No projects listed', ja: 'プロジェクト情報がありません' },
  teaching: { en: 'No courses listed', ja: '講義情報がありません' },
  default: { en: 'No content available', ja: 'コンテンツがありません' },
};

export function EmptyState({
  title = defaultTitles.default,
  message,
  icon
}: EmptyStateProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div
          className="mb-4 text-4xl opacity-30"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3
        className="font-display text-xl mb-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        {t(title)}
      </h3>
      {message && (
        <p
          className="text-sm max-w-md"
          style={{ color: 'var(--text-muted)' }}
        >
          {t(message)}
        </p>
      )}
    </div>
  );
}

// Pre-configured empty states for common sections
export function EmptyPublications() {
  return (
    <EmptyState
      title={defaultTitles.publications}
      message={{
        en: 'Check back soon for our latest research publications.',
        ja: '最新の研究論文は近日公開予定です。'
      }}
      icon={<span>📚</span>}
    />
  );
}

export function EmptyMembers() {
  return (
    <EmptyState
      title={defaultTitles.members}
      message={{
        en: 'Team information will be available soon.',
        ja: 'メンバー情報は近日公開予定です。'
      }}
      icon={<span>👥</span>}
    />
  );
}

export function EmptyNews() {
  return (
    <EmptyState
      title={defaultTitles.news}
      message={{
        en: 'Stay tuned for the latest updates from our lab.',
        ja: '研究室からの最新情報をお待ちください。'
      }}
      icon={<span>📰</span>}
    />
  );
}

export function EmptyResearch() {
  return (
    <EmptyState
      title={defaultTitles.research}
      message={{
        en: 'Our research themes are being prepared.',
        ja: '研究テーマの情報を準備中です。'
      }}
      icon={<span>🔬</span>}
    />
  );
}

export default EmptyState;
