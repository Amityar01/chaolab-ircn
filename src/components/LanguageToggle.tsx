'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
      className="lang-toggle"
      aria-label="Toggle language"
    >
      <span className={language === 'en' ? 'active' : ''}>EN</span>
      <span className="separator">/</span>
      <span className={language === 'ja' ? 'active' : ''}>JP</span>
    </button>
  );
}
