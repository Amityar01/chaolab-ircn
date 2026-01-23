'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        aria-pressed={language === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ja')}
        className={`lang-btn ${language === 'ja' ? 'active' : ''}`}
        aria-pressed={language === 'ja'}
      >
        日本語
      </button>
    </div>
  );
}
