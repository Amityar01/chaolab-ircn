'use client';

import { Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ContactInfo } from '@/types/content';

interface ContactClientProps {
  contact: ContactInfo | null;
}

export default function ContactClient({ contact }: ContactClientProps) {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="section-title">{t({ en: 'Contact', ja: 'アクセス' })}</h1>

      <div className="grid grid-2">
        <div className="card">
          <h2>{t({ en: 'Address', ja: '住所' })}</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <MapPin size={20} className="text-muted" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
            <p className="text-secondary" style={{ whiteSpace: 'pre-line' }}>
              {contact ? t(contact.address) : t({ en: 'Address not set', ja: '住所未設定' })}
            </p>
          </div>
        </div>

        <div className="card">
          <h2>{t({ en: 'Email', ja: 'メール' })}</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Mail size={20} className="text-muted" />
            {contact?.email ? (
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            ) : (
              <span className="text-secondary">{t({ en: 'Email not set', ja: 'メール未設定' })}</span>
            )}
          </div>
        </div>
      </div>

      {contact?.mapUrl && (
        <div className="card mt-4">
          <h2>{t({ en: 'Location', ja: '地図' })}</h2>
          <iframe
            src={contact.mapUrl}
            width="100%"
            height="400"
            style={{ border: 0, borderRadius: '8px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  );
}
