'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ContactInfo } from '@/types/content';

interface ContactClientProps {
  contact: ContactInfo | null;
}

export default function ContactClient({ contact }: ContactClientProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    // For now, just simulate sending (you can connect to a real API later)
    // In production, you'd send to a serverless function or email service
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mailto link as fallback
      const subject = encodeURIComponent(`Contact from ${formData.name}`);
      const body = encodeURIComponent(`From: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`);
      window.location.href = `mailto:${contact?.email || 'zenas.c.chao@ircn.jp'}?subject=${subject}&body=${body}`;

      setStatus('sent');
      setFormData({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="contact-page">
      <header className="page-header">
        <span className="overline">{t({ en: 'Get in Touch', ja: 'お問い合わせ' })}</span>
        <h1>{t({ en: 'Contact', ja: 'アクセス' })}</h1>
      </header>

      <div className="contact-grid">
        {/* Contact Form */}
        <div className="contact-form-section">
          <h2>{t({ en: 'Send a Message', ja: 'メッセージを送る' })}</h2>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">{t({ en: 'Name', ja: 'お名前' })}</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder={t({ en: 'Your name', ja: 'お名前' })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t({ en: 'Email', ja: 'メールアドレス' })}</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder={t({ en: 'your@email.com', ja: 'your@email.com' })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">{t({ en: 'Message', ja: 'メッセージ' })}</label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
                placeholder={t({ en: 'Your message...', ja: 'メッセージ...' })}
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={status === 'sending'}
            >
              {status === 'sending'
                ? t({ en: 'Sending...', ja: '送信中...' })
                : t({ en: 'Send Message', ja: '送信する' })}
            </button>

            {status === 'sent' && (
              <p className="form-success">
                {t({ en: 'Message sent! We\'ll get back to you soon.', ja: 'メッセージを送信しました！' })}
              </p>
            )}
          </form>
        </div>

        {/* Contact Info */}
        <div className="contact-info-section">
          <div className="info-card">
            <div className="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h3>{t({ en: 'Email', ja: 'メール' })}</h3>
            <a href={`mailto:${contact?.email || 'zenas.c.chao@ircn.jp'}`} className="info-value">
              {contact?.email || 'zenas.c.chao@ircn.jp'}
            </a>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3>{t({ en: 'Address', ja: '住所' })}</h3>
            <p className="info-value address">
              {contact ? t(contact.address) : (
                <>
                  The University of Tokyo<br />
                  International Research Center for Neurointelligence (IRCN)<br />
                  7-3-1 Hongo Bunkyo-ku, Tokyo<br />
                  113-0033 JAPAN
                </>
              )}
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <h3>{t({ en: 'Affiliation', ja: '所属' })}</h3>
            <p className="info-value">
              <a href="https://ircn.jp" target="_blank" rel="noopener noreferrer">
                IRCN - International Research Center for Neurointelligence
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      {contact?.mapUrl && (
        <div className="map-section">
          <iframe
            src={contact.mapUrl}
            width="100%"
            height="400"
            style={{ border: 0, borderRadius: '16px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      <style jsx>{`
        .contact-page {
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
        }

        .contact-grid {
          display: grid;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        @media (min-width: 768px) {
          .contact-grid {
            grid-template-columns: 1.2fr 1fr;
          }
        }

        /* Contact Form */
        .contact-form-section h2 {
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-group input,
        .form-group textarea {
          padding: 1rem;
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: var(--text-muted);
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--firefly-glow);
          box-shadow: 0 0 0 3px rgba(255, 213, 79, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 120px;
        }

        .submit-btn {
          padding: 1rem 2rem;
          background: var(--firefly-glow);
          color: var(--deep-space);
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 213, 79, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .form-success {
          color: #4ade80;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        /* Contact Info */
        .contact-info-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-card {
          background: var(--card-glass);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .info-icon {
          width: 40px;
          height: 40px;
          margin-bottom: 1rem;
          color: var(--firefly-glow);
          opacity: 0.8;
        }

        .info-icon svg {
          width: 100%;
          height: 100%;
        }

        .info-card h3 {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
        }

        .info-value {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .info-value.address {
          white-space: pre-line;
        }

        .info-value a {
          color: var(--accent-purple);
          transition: color 0.2s;
        }

        .info-value a:hover {
          color: var(--text-primary);
        }

        /* Map */
        .map-section {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--card-border);
        }

        @media (max-width: 640px) {
          .page-header h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
