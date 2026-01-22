import type { Metadata } from 'next';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getTranslations } from '@/lib/content';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lab Name - Research Laboratory',
  description: 'Research laboratory website',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const translations = getTranslations();

  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <div className="page-container">
            <Navigation translations={translations} />
            <main className="main-content">{children}</main>
            <Footer translations={translations} />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
