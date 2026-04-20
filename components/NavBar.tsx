'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Session {
  user_id: number; username: string; nickname: string;
  name?: string; christen?: string; chukmonth?: number; chukday?: number;
  email?: string; phone_number?: string; parish?: string; church?: string;
  gyogu_code?: string; bon_cd?: string;
}

export default function NavBar({ session, isAdmin }: { session: Session | null; isAdmin?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <nav style={{
      background: 'rgba(22,33,62,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 로고 */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>✝️</span>
            <span style={{ fontWeight: 900, fontSize: '1.2rem', background: 'linear-gradient(135deg, #e94560, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              가톨릭 퀴즈
            </span>
          </div>
        </Link>

        {/* 네비 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href="/ranking" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>🏆 랭킹</button>
          </Link>

          {isAdmin && (
            <Link href="/admin" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', color: '#f5a623', borderColor: '#f5a62366' }}>
                ⚙️ 관리자
              </button>
            </Link>
          )}

          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/my" style={{ textDecoration: 'none' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{session.name || session.nickname}</span>님
                </span>
              </Link>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
                로그아웃
              </button>
            </div>
          ) : (
            <a href="/api/auth/goodnews" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.875rem' }}>로그인</button>
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
