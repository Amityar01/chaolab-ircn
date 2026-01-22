import { getAllResearchThemes } from '@/lib/content';
import ResearchClient from './ResearchClient';

export default function ResearchPage() {
  const themes = getAllResearchThemes();
  return <ResearchClient themes={themes} />;
}
