import { getAllMembers } from '@/lib/content';
import MembersClient from './MembersClient';

export default function MembersPage() {
  const members = getAllMembers();
  return <MembersClient members={members} />;
}
