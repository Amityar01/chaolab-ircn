// Bilingual text field - use this for all user-facing text
export interface BilingualText {
  en: string;
  ja: string;
}

// Member types - now dynamic from site config
export type MemberCategory = string;

export interface MemberLink {
  type: string;
  url: string;
  label?: BilingualText;
}

export interface EducationEntry {
  year: string;
  event: string;
  details?: string;
}

export interface CareerEntry {
  year: string;
  position: string;
  institution: string;
  focus?: string;
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
  education?: EducationEntry[];
  career?: CareerEntry[];
  tags?: string[];
}

// Publication types - now dynamic from site config
export type PublicationType = string;

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

// News types - now dynamic from site config
export type NewsCategory = string;

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
  order?: number;
  sectionLabel?: BilingualText;
  title: BilingualText;
  question?: BilingualText;
  description: BilingualText;
  methods?: BilingualText;
  keyFindings?: BilingualText;
  relatedPublications?: string[]; // DOIs or publication IDs
  accentColor?: string;
  image?: string;
  tags?: string[];
}

// Teaching
export interface TeachingCourse {
  id: string;
  order?: number;
  title: BilingualText;
  institution: BilingualText;
  courseCode?: string;
  description: BilingualText;
  objectives?: BilingualText[];
  tags?: string[];
}

// Projects
export interface ProjectPartner {
  name: BilingualText;
  url?: string;
}

export interface Project {
  id: string;
  slug: string;
  order?: number;
  title: BilingualText;
  subtitle?: BilingualText;
  collaboration?: BilingualText;
  description: BilingualText;
  goals?: BilingualText[];
  partners?: ProjectPartner[];
  registerUrl?: string;
  accentColor?: string;
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
  description?: BilingualText;
  heroImage?: string;
  featuredResearch?: string[];
}

// Translations for UI strings
export interface Translations {
  nav: Record<string, BilingualText>;
  common: Record<string, BilingualText>;
  categories: Record<string, BilingualText>;
}

// Site configuration
export interface CategoryConfig {
  id: string;
  label: BilingualText;
  order?: number;
}

export interface SiteConfig {
  memberCategories: CategoryConfig[];
  publicationTypes: CategoryConfig[];
  newsCategories: CategoryConfig[];
  commonTags: string[];
}
