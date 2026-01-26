'use client';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ message, size = 'md' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className="flex flex-col items-center justify-center py-16 gap-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-t-transparent animate-spin`}
        style={{
          borderColor: 'var(--card-border)',
          borderTopColor: 'transparent',
        }}
        aria-hidden="true"
      />
      {message && (
        <p
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          {message}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Skeleton loaders for specific content types
export function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-6 animate-pulse"
      style={{
        background: 'var(--card-glass)',
        border: '1px solid var(--card-border)',
      }}
      aria-hidden="true"
    >
      <div
        className="h-4 rounded mb-4 w-3/4"
        style={{ background: 'var(--card-border)' }}
      />
      <div
        className="h-3 rounded mb-2 w-full"
        style={{ background: 'var(--card-border)' }}
      />
      <div
        className="h-3 rounded w-2/3"
        style={{ background: 'var(--card-border)' }}
      />
    </div>
  );
}

export function SkeletonMemberCard() {
  return (
    <div
      className="flex gap-4 p-4 rounded-xl animate-pulse"
      style={{
        background: 'var(--card-glass)',
        border: '1px solid var(--card-border)',
      }}
      aria-hidden="true"
    >
      <div
        className="w-16 h-16 rounded-lg flex-shrink-0"
        style={{ background: 'var(--card-border)' }}
      />
      <div className="flex-1">
        <div
          className="h-4 rounded mb-2 w-1/2"
          style={{ background: 'var(--card-border)' }}
        />
        <div
          className="h-3 rounded w-3/4"
          style={{ background: 'var(--card-border)' }}
        />
      </div>
    </div>
  );
}

export function SkeletonPublicationItem() {
  return (
    <div
      className="py-4 border-b animate-pulse"
      style={{ borderColor: 'var(--card-border)' }}
      aria-hidden="true"
    >
      <div
        className="h-4 rounded mb-2 w-full"
        style={{ background: 'var(--card-border)' }}
      />
      <div
        className="h-3 rounded mb-1 w-3/4"
        style={{ background: 'var(--card-border)' }}
      />
      <div
        className="h-3 rounded w-1/2"
        style={{ background: 'var(--card-border)' }}
      />
    </div>
  );
}

export function SkeletonList({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'member' | 'publication' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  const SkeletonComponent = {
    card: SkeletonCard,
    member: SkeletonMemberCard,
    publication: SkeletonPublicationItem,
  }[type];

  return (
    <div className="space-y-4" role="status" aria-busy="true">
      {items.map((i) => <SkeletonComponent key={i} />)}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

export default LoadingState;
