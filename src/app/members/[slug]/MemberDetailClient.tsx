'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Member } from '@/types/content';

interface MemberDetailClientProps {
  member: Member;
}

export default function MemberDetailClient({ member }: MemberDetailClientProps) {
  const { t } = useLanguage();

  return (
    <div>
      <Link href="/members" className="btn btn-secondary mb-4">
        <ArrowLeft size={16} />
        {t({ en: 'Back to Members', ja: 'メンバー一覧へ' })}
      </Link>

      <div className="card">
        <div className="member-card" style={{ alignItems: 'center', marginBottom: '2rem' }}>
          {member.image ? (
            <Image
              src={member.image}
              alt={t(member.name)}
              width={120}
              height={120}
              className="member-photo"
              style={{ width: 120, height: 120 }}
            />
          ) : (
            <div className="member-photo" style={{ width: 120, height: 120 }} />
          )}
          <div className="member-info">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t(member.name)}</h1>
            <p style={{ fontSize: '1rem' }}>{t(member.role)}</p>
            {member.email && (
              <a href={`mailto:${member.email}`} className="mt-1" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} /> {member.email}
              </a>
            )}
          </div>
        </div>

        {member.bio && (
          <section className="mb-4">
            <h2>{t({ en: 'Biography', ja: '経歴' })}</h2>
            <p className="text-secondary">{t(member.bio)}</p>
          </section>
        )}

        {member.research && member.research.length > 0 && (
          <section className="mb-4">
            <h2>{t({ en: 'Research Interests', ja: '研究分野' })}</h2>
            <ul>
              {member.research.map((item, idx) => (
                <li key={idx} className="text-secondary">{item}</li>
              ))}
            </ul>
          </section>
        )}

        {member.links && member.links.length > 0 && (
          <section>
            <h2>{t({ en: 'Links', ja: 'リンク' })}</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {member.links.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <ExternalLink size={16} />
                  {link.label ? t(link.label) : link.type}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
