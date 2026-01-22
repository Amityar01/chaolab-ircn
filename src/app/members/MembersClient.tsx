'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Member, MemberCategory } from '@/types/content';

interface MembersClientProps {
  members: Member[];
}

const categoryLabels: Record<MemberCategory, { en: string; ja: string }> = {
  faculty: { en: 'Faculty', ja: '教員' },
  staff: { en: 'Staff', ja: 'スタッフ' },
  students: { en: 'Students', ja: '学生' },
  alumni: { en: 'Alumni', ja: '卒業生' },
};

const categoryOrder: MemberCategory[] = ['faculty', 'staff', 'students', 'alumni'];

export default function MembersClient({ members }: MembersClientProps) {
  const { t } = useLanguage();

  const membersByCategory = categoryOrder.reduce((acc, category) => {
    acc[category] = members.filter((m) => m.category === category);
    return acc;
  }, {} as Record<MemberCategory, Member[]>);

  return (
    <div>
      <h1 className="section-title">{t({ en: 'Members', ja: 'メンバー' })}</h1>

      {categoryOrder.map((category) => {
        const categoryMembers = membersByCategory[category];
        if (categoryMembers.length === 0) return null;

        return (
          <section key={category} className="section">
            <h2>{t(categoryLabels[category])}</h2>
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
