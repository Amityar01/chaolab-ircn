// Bilingual text field - use this for all user-facing text
export interface BilingualText {
  en: string;
  ja: string;
}

// Member types
export type MemberCategory = 'faculty' | 'staff' | 'students' | 'alumni';

export interface MemberLink {
  type: string;
  url: string;
  label?: BilingualText;
}

export interface Member {
  id: string;
  slug: string;
  category: MemberCategory;
  name: BilingualText;
  role: BilingualText;
  bio?: BilingualText;
  image?: string;
  email?: string;
  links?: MemberLink[];
  research?: string[];
  education?: Array<{ year: string; event: string }>;
}

// Publication types
export type PublicationType = 'journal' | 'conference' | 'book' | 'preprint' | 'thesis';

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  conference?: string;
  volume?: string;
  pages?: string;
  doi?: string;
  type: PublicationType;
  tags?: string[];
}

// News types
export type NewsCategory = 'publication' | 'award' | 'event' | 'announcement';

export interface NewsItem {
  id: string;
  title: BilingualText;
  date: string;
  category: NewsCategory;
  excerpt?: BilingualText;
  content?: BilingualText;
  image?: string;
  link?: string;
}

// Research theme
export interface ResearchTheme {
  id: string;
  title: BilingualText;
  description: BilingualText;
  image?: string;
  tags?: string[];
}

// Contact info
export interface ContactInfo {
  address: BilingualText;
  email: string;
  phone?: string;
  mapUrl?: string;
}

// Homepage settings
export interface HomepageSettings {
  labName: BilingualText;
  tagline: BilingualText;
  heroImage?: string;
  featuredResearch?: string[];
}

// Translations for UI strings
export interface Translations {
  nav: Record<string, BilingualText>;
  common: Record<string, BilingualText>;
  categories: Record<string, BilingualText>;
}
