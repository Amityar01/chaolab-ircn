import type { Metadata } from 'next';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getTranslations } from '@/lib/content';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chaolab.ircn.jp';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Chao Lab - IRCN, University of Tokyo',
    template: '%s | Chao Lab',
  },
  description: 'Predictive Coding & Creativity Research Laboratory at the International Research Center for Neurointelligence (IRCN), University of Tokyo. We study how the brain predicts and how prediction enables creativity.',
  keywords: ['predictive coding', 'creativity', 'neuroscience', 'IRCN', 'University of Tokyo', 'brain research', 'neural networks'],
  authors: [{ name: 'Chao Lab' }],
  creator: 'Chao Lab',
  publisher: 'IRCN, University of Tokyo',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ja_JP',
    url: BASE_URL,
    siteName: 'Chao Lab',
    title: 'Chao Lab - Predictive Coding & Creativity Research',
    description: 'Investigating predictive coding in the brain and its applications to understanding and augmenting human creativity.',
    images: [
      {
        url: '/uploads/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Chao Lab - IRCN, University of Tokyo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chao Lab - IRCN, University of Tokyo',
    description: 'Predictive Coding & Creativity Research Laboratory',
    images: ['/uploads/og-image.png'],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'en': BASE_URL,
      'ja': BASE_URL,
    },
  },
  other: {
    'theme-color': '#070b14',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const translations = getTranslations();

  // Structured data (JSON-LD) for organization
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',
    name: 'Chao Lab',
    url: BASE_URL,
    logo: `${BASE_URL}/uploads/logo.png`,
    description: 'Predictive Coding & Creativity Research Laboratory',
    parentOrganization: {
      '@type': 'ResearchOrganization',
      name: 'International Research Center for Neurointelligence (IRCN)',
      url: 'https://ircn.jp',
      parentOrganization: {
        '@type': 'EducationalOrganization',
        name: 'University of Tokyo',
        url: 'https://www.u-tokyo.ac.jp',
      },
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'JP',
      addressLocality: 'Tokyo',
    },
    sameAs: [],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
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
