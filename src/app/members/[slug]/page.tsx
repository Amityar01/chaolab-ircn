import { getMemberBySlug, getAllMemberSlugs } from '@/lib/content';
import { notFound } from 'next/navigation';
import MemberDetailClient from './MemberDetailClient';

export async function generateStaticParams() {
  const slugs = getAllMemberSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MemberPage({ params }: PageProps) {
  const { slug } = await params;
  const member = getMemberBySlug(slug);

  if (!member) {
    notFound();
  }

  return <MemberDetailClient member={member} />;
}
