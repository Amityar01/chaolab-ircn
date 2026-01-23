'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Translations } from '@/types/content';

interface NavigationProps {
  translations: Translations | null;
}

export default function Navigation({ translations }: NavigationProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: translations?.nav?.home || { en: 'Home', ja: 'ホーム' } },
    { href: '/research', label: translations?.nav?.research || { en: 'Research', ja: '研究' } },
    { href: '/projects', label: translations?.nav?.projects || { en: 'Projects', ja: 'プロジェクト' } },
    { href: '/members', label: translations?.nav?.members || { en: 'Members', ja: 'メンバー' } },
    { href: '/publications', label: translations?.nav?.publications || { en: 'Publications', ja: '業績' } },
    { href: '/teaching', label: translations?.nav?.teaching || { en: 'Teaching', ja: '講義' } },
    { href: '/news', label: translations?.nav?.news || { en: 'News', ja: 'ニュース' } },
    { href: '/contact', label: translations?.nav?.contact || { en: 'Contact', ja: 'アクセス' } },
  ];

  return (
    <nav className={`nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          Chao Lab
        </Link>

        {/* Desktop nav */}
        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            >
              {t(item.label)}
            </Link>
          ))}
          <LanguageToggle />
        </div>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(item.label)}
            </Link>
          ))}
          <div className="mobile-lang-toggle">
            <LanguageToggle />
          </div>
        </div>
      )}
    </nav>
  );
}
