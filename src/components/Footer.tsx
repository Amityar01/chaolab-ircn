'use client';

import Link from 'next/link';
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
          <div className="footer-brand">
            <h3>Chao Lab</h3>
            <p>
              {t({
                en: 'Investigating predictive coding and creativity at the International Research Center for Neurointelligence, University of Tokyo.',
                ja: '東京大学国際高等研究所ニューロインテリジェンス国際研究機構にて、予測符号化と創造性を研究しています。'
              })}
            </p>
          </div>

          <div className="footer-section">
            <h4>{t({ en: 'Research', ja: '研究' })}</h4>
            <ul>
              <li><Link href="/research">{t({ en: 'Overview', ja: '概要' })}</Link></li>
              <li><Link href="/publications">{t({ en: 'Publications', ja: '業績' })}</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>{t({ en: 'Lab', ja: '研究室' })}</h4>
            <ul>
              <li><Link href="/members">{t({ en: 'Members', ja: 'メンバー' })}</Link></li>
              <li><Link href="/news">{t({ en: 'News', ja: 'ニュース' })}</Link></li>
              <li><Link href="/contact">{t({ en: 'Contact', ja: 'アクセス' })}</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Chao Lab, IRCN, University of Tokyo</p>
          <div className="footer-affiliations">
            <a href="https://ircn.jp" target="_blank" rel="noopener noreferrer">
              <span>IRCN</span>
            </a>
            <a href="https://www.u-tokyo.ac.jp" target="_blank" rel="noopener noreferrer">
              <span>{t({ en: 'UTokyo', ja: '東京大学' })}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
