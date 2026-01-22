'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { Translations } from '@/types/content';

interface FooterProps {
  translations: Translations | null;
}

export default function Footer({ translations }: FooterProps) {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Lab Name</h3>
            <p>{t(translations?.common?.footerDescription || { en: 'Research laboratory description', ja: '研究室の説明' })}</p>
          </div>
          <div className="footer-section">
            <h4>{t({ en: 'Quick Links', ja: 'リンク' })}</h4>
            <ul>
              <li><a href="/research">{t({ en: 'Research', ja: '研究' })}</a></li>
              <li><a href="/publications">{t({ en: 'Publications', ja: '業績' })}</a></li>
              <li><a href="/contact">{t({ en: 'Contact', ja: 'アクセス' })}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {currentYear} Lab Name. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
