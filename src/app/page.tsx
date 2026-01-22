import { getHomepageSettings, getAllNews, getAllResearchThemes } from '@/lib/content';
import HomeClient from './HomeClient';

export default function HomePage() {
  const settings = getHomepageSettings();
  const news = getAllNews().slice(0, 5); // Latest 5 news items
  const themes = getAllResearchThemes();

  return <HomeClient settings={settings} news={news} themes={themes} />;
}
