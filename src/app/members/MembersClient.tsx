'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Member, CategoryConfig } from '@/types/content';

interface MembersClientProps {
  members: Member[];
  categories: CategoryConfig[];
}

export default function MembersClient({ members, categories }: MembersClientProps) {
  const { t } = useLanguage();

  // Sort categories by order
  const sortedCategories = [...categories].sort((a, b) => (a.order || 99) - (b.order || 99));

  const membersByCategory = sortedCategories.reduce((acc, cat) => {
    acc[cat.id] = members.filter((m) => m.category === cat.id);
    return acc;
  }, {} as Record<string, Member[]>);

  return (
    <div>
      <h1 className="section-title">{t({ en: 'Members', ja: 'メンバー' })}</h1>

      {sortedCategories.map((category) => {
        const categoryMembers = membersByCategory[category.id];
        if (!categoryMembers || categoryMembers.length === 0) return null;

        return (
          <section key={category.id} className="section">
            <h2>{t(category.label)}</h2>
            <div className="grid grid-2">
              {categoryMembers.map((member) => (
                <Link key={member.id} href={`/members/${member.slug}`} className="card member-card">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={t(member.name)}
                      width={80}
                      height={80}
                      className="member-photo"
                    />
                  ) : (
                    <div className="member-photo" />
                  )}
                  <div className="member-info">
                    <h3>{t(member.name)}</h3>
                    <p>{t(member.role)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
