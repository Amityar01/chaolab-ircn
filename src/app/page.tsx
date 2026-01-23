import { getHomepageSettings, getAllNews, getAllResearchThemes, getAllMembers, getAllPublications, getContactInfo } from '@/lib/content';
import HomeClient from './HomeClient';

export default function HomePage() {
  const settings = getHomepageSettings();
  const contact = getContactInfo();
  const news = getAllNews().slice(0, 5);
  const themes = getAllResearchThemes();
  const members = getAllMembers();
  const publications = getAllPublications().slice(0, 4);

  const pi = members.find(m => m.category === 'faculty') || null;
  const memberCount = members.filter(m => m.category !== 'alumni').length;

  return (
    <HomeClient
      settings={settings}
      contact={contact}
      news={news}
      themes={themes}
      pi={pi}
      memberCount={memberCount}
      publications={publications}
    />
  );
}
