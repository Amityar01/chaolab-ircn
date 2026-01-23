import { getAllMembers, getSiteConfig } from '@/lib/content';
import MembersClient from './MembersClient';

export default function MembersPage() {
  const members = getAllMembers();
  const siteConfig = getSiteConfig();
  return <MembersClient members={members} categories={siteConfig.memberCategories} />;
}
