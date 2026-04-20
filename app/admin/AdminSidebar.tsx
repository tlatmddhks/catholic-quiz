'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/admin',         label: '대시보드',  icon: '📊' },
  { href: '/admin/quiz',    label: '문제 관리', icon: '❓' },
  { href: '/admin/members', label: '회원 관리', icon: '👥' },
  { href: '/admin/stats',   label: '통계',      icon: '📈' },
  { href: '/admin/ranking', label: '랭킹 관리', icon: '🏆' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: 'rgba(22,33,62,0.95)',
      borderRight: '1px solid var(--border)',
      padding: '1.5rem 0',
    }}>
      <div style={{ padding: '0 1rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
        ADMIN
      </div>
      {links.map(link => {
        const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              padding: '0.7rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              fontSize: '0.9rem', fontWeight: active ? 700 : 400,
              color: active ? 'var(--accent)' : 'var(--text-muted)',
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
