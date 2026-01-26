'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex flex-col items-center justify-center p-8 text-center"
          style={{ minHeight: '200px' }}
        >
          <div
            className="text-4xl mb-4"
            style={{ color: 'var(--text-muted)' }}
          >
            :(
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Something went wrong loading this section.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 rounded-lg text-sm transition-colors"
            style={{
              background: 'var(--card-glass)',
              border: '1px solid var(--card-border)',
              color: 'var(--firefly-glow)',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lightweight fallback for interactive sections
export function InteractiveFallback() {
  return (
    <div
      className="flex items-center justify-center p-8"
      style={{
        minHeight: '300px',
        background: 'var(--card-glass)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
      }}
    >
      <p style={{ color: 'var(--text-muted)' }}>
        Interactive content unavailable
      </p>
    </div>
  );
}
