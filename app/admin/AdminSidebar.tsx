'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const baseLinks = [
  { href: '/admin',          label: '대시보드',      icon: '📊' },
  { href: '/admin/quiz',     label: '문제 관리',     icon: '❓' },
  { href: '/admin/survival', label: '서바이벌 관리', icon: '❤️' },
  { href: '/admin/members',  label: '회원 관리',     icon: '👥' },
  { href: '/admin/notice',   label: '공지사항',      icon: '📢' },
  { href: '/admin/stats',    label: '통계',          icon: '📈' },
  { href: '/admin/ranking',  label: '랭킹 관리',     icon: '🏆' },
];

const superLinks = [
  { href: '/admin/admins', label: '관리자 관리', icon: '🔑' },
];

export default function AdminSidebar({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const links = isSuperAdmin ? [...baseLinks, ...superLinks] : baseLinks;

  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: 'rgba(22,33,62,0.95)',
      borderRight: '1px solid var(--border)',
      padding: '1.5rem 0',
    }}>
      <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
        ADMIN
      </div>
      {isSuperAdmin && (
        <div style={{ padding: '0.25rem 1rem 0.75rem', fontSize: '0.7rem', color: '#f5a623', fontWeight: 700 }}>
          슈퍼 관리자
        </div>
      )}
      {links.map(link => {
        const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
        const isSuperOnly = superLinks.some(l => l.href === link.href);
        return (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              padding: '0.7rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              fontSize: '0.9rem', fontWeight: active ? 700 : 400,
              color: active ? 'var(--accent)' : isSuperOnly ? '#f5a623aa' : 'var(--text-muted)',
              background: active ? 'rgba(233,69,96,0.1)' : 'transparent',
              borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
              transition: 'all 0.15s',
            }}>
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </div>
          </Link>
        );
      })}
    </aside>
  );
}
