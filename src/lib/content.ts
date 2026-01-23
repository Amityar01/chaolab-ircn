import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import type {
  Member,
  MemberCategory,
  Publication,
  NewsItem,
  ResearchTheme,
  TeachingCourse,
  Project,
  ContactInfo,
  HomepageSettings,
  Translations,
  SiteConfig,
} from '@/types/content';

const contentDir = path.join(process.cwd(), 'content');

// Helper to read YAML file
function readYaml<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content) as T;
  } catch {
    return null;
  }
}

// Helper to read Markdown file with frontmatter
function readMarkdown<T>(filePath: string): (T & { content: string }) | null {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    return { ...data, content } as T & { content: string };
  } catch {
    return null;
  }
}

// Helper to get all files in directory
function getFilesInDir(dir: string, ext: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.endsWith(ext));
  } catch {
    return [];
  }
}

// ============ MEMBERS ============

export function getAllMembers(): Member[] {
  const members: Member[] = [];
  const categories = getMemberCategories();

  for (const category of categories) {
    const categoryDir = path.join(contentDir, 'members', category);
    const files = getFilesInDir(categoryDir, '.yaml');

    for (const file of files) {
      const data = readYaml<Member>(path.join(categoryDir, file));
      if (data) {
        members.push({ ...data, category });
      }
    }
  }

  return members;
}

export function getMembersByCategory(category: MemberCategory): Member[] {
  return getAllMembers().filter((m) => m.category === category);
}

export function getMemberBySlug(slug: string): Member | null {
  return getAllMembers().find((m) => m.slug === slug) || null;
}

export function getAllMemberSlugs(): string[] {
  return getAllMembers().map((m) => m.slug);
}

// ============ PUBLICATIONS ============

export function getAllPublications(): Publication[] {
  const pubDir = path.join(contentDir, 'publications');
  const files = getFilesInDir(pubDir, '.yaml');
  const publications: Publication[] = [];

  for (const file of files) {
    const data = readYaml<Publication>(path.join(pubDir, file));
    if (data) {
      publications.push(data);
    }
  }

  // Sort by year descending
  return publications.sort((a, b) => b.year - a.year);
}

// ============ NEWS ============

export function getAllNews(): NewsItem[] {
  const newsDir = path.join(contentDir, 'news');
  const files = getFilesInDir(newsDir, '.md');
  const news: NewsItem[] = [];

  for (const file of files) {
    const data = readMarkdown<NewsItem>(path.join(newsDir, file));
    if (data) {
      // Extract ID from filename if not present
      if (!data.id) {
        data.id = file.replace('.md', '');
      }
      news.push(data);
    }
  }

  // Sort by date descending
  return news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ============ RESEARCH ============

export function getAllResearchThemes(): ResearchTheme[] {
  const themesDir = path.join(contentDir, 'research', 'themes');
  const files = getFilesInDir(themesDir, '.yaml');
  const themes: ResearchTheme[] = [];

  for (const file of files) {
    const data = readYaml<ResearchTheme>(path.join(themesDir, file));
    if (data) {
      themes.push(data);
    }
  }

  return themes;
}

// ============ TEACHING ============

export function getAllTeachingCourses(): TeachingCourse[] {
  const teachingDir = path.join(contentDir, 'teaching');
  const files = getFilesInDir(teachingDir, '.yaml');
  const courses: TeachingCourse[] = [];

  for (const file of files) {
    const data = readYaml<TeachingCourse>(path.join(teachingDir, file));
    if (data) {
      courses.push(data);
    }
  }

  return courses.sort((a, b) => (a.order || 99) - (b.order || 99));
}

// ============ PROJECTS ============

export function getAllProjects(): Project[] {
  const projectsDir = path.join(contentDir, 'projects');
  const files = getFilesInDir(projectsDir, '.yaml');
  const projects: Project[] = [];

  for (const file of files) {
    const data = readYaml<Project>(path.join(projectsDir, file));
    if (data) {
      projects.push(data);
    }
  }

  return projects.sort((a, b) => (a.order || 99) - (b.order || 99));
}

// ============ CONTACT ============

export function getContactInfo(): ContactInfo | null {
  return readYaml<ContactInfo>(path.join(contentDir, 'contact.yaml'));
}

// ============ SETTINGS ============

export function getHomepageSettings(): HomepageSettings | null {
  return readYaml<HomepageSettings>(path.join(contentDir, 'settings', 'homepage.yaml'));
}

// ============ TRANSLATIONS ============

export function getTranslations(): Translations | null {
  return readYaml<Translations>(path.join(contentDir, 'translations.yaml'));
}

// ============ SITE CONFIG ============

const defaultSiteConfig: SiteConfig = {
  memberCategories: [
    { id: 'faculty', label: { en: 'Faculty', ja: '教員' }, order: 1 },
    { id: 'assistant-professors', label: { en: 'Assistant Professors', ja: '助教' }, order: 2 },
    { id: 'postdocs', label: { en: 'Postdoctoral Fellows', ja: '博士研究員' }, order: 3 },
    { id: 'students', label: { en: 'PhD Students', ja: '博士課程学生' }, order: 4 },
    { id: 'staff', label: { en: 'Staff', ja: 'スタッフ' }, order: 5 },
    { id: 'alumni', label: { en: 'Alumni', ja: '卒業生' }, order: 6 },
  ],
  publicationTypes: [
    { id: 'journal', label: { en: 'Journal Article', ja: '学術論文' } },
    { id: 'conference', label: { en: 'Conference Paper', ja: '学会発表' } },
    { id: 'book-chapter', label: { en: 'Book/Chapter', ja: '書籍・章' } },
    { id: 'preprint', label: { en: 'Preprint', ja: 'プレプリント' } },
    { id: 'thesis', label: { en: 'Thesis', ja: '学位論文' } },
  ],
  newsCategories: [
    { id: 'publication', label: { en: 'Publication', ja: '論文' } },
    { id: 'award', label: { en: 'Award', ja: '受賞' } },
    { id: 'event', label: { en: 'Event', ja: 'イベント' } },
    { id: 'announcement', label: { en: 'Announcement', ja: 'お知らせ' } },
  ],
  commonTags: [],
};

export function getSiteConfig(): SiteConfig {
  const config = readYaml<SiteConfig>(path.join(contentDir, 'settings', 'site-config.yaml'));
  return config || defaultSiteConfig;
}

export function getMemberCategories(): MemberCategory[] {
  const config = getSiteConfig();
  return config.memberCategories
    .sort((a, b) => (a.order || 99) - (b.order || 99))
    .map(c => c.id);
}
