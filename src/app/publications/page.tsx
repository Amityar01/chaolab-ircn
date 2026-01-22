import { getAllPublications } from '@/lib/content';
import PublicationsClient from './PublicationsClient';

export default function PublicationsPage() {
  const publications = getAllPublications();
  return <PublicationsClient publications={publications} />;
}
