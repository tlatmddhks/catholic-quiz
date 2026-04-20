import db from '@/lib/db';
import Link from 'next/link';

async function getDashboardStats() {
  const [quizCount, userCount, todayPlays, weekPlays, recentUsers, recentPlays] = await Promise.all([
    db.query('SELECT CAST(COUNT(*) AS INT) AS cnt FROM dbo.quiz'),
    db.query('SELECT CAST(COUNT(*) AS INT) AS cnt FROM dbo.quiz_user'),
    db.query("SELECT CAST(COUNT(*) AS INT) AS cnt FROM dbo.quiz_result WHERE played_at >= CAST(GETDATE() AS DATE)"),
    db.query("SELECT CAST(COUNT(*) AS INT) AS cnt FROM dbo.quiz_result WHERE played_at >= DATEADD(day,-7,GETDATE())"),
    db.query('SELECT TOP 5 name, nickname, parish, created_at FROM dbo.quiz_user ORDER BY created_at DESC'),
    db.query(`SELECT TOP 5 u.name, u.nickname, r.mode, r.score, r.played_at
              FROM dbo.quiz_result r JOIN dbo.quiz_user u ON u.user_id = r.user_id
              ORDER BY r.played_at DESC`),
  ]);
  return {
    quizCount: quizCount.rows[0]?.cnt ?? 0,
    userCount: userCount.rows[0]?.cnt ?? 0,
    todayPlays: todayPlays.rows[0]?.cnt ?? 0,
    weekPlays: weekPlays.rows[0]?.cnt ?? 0,
    recentUsers: recentUsers.rows,
    recentPlays: recentPlays.rows,
  };
}

const MODE_LABEL: Record<string, string> = {
  ox: 'OX', chosung: '셔플', survival: '서바이벌', random: '랜덤',
};

export default async function AdminDashboard() {
  const stats = await getDashboardStats().catch(() => null);

  const cards = [
    { label: '총 문제 수',     value: stats?.quizCount ?? '-',   color: '#00d4ff', href: '/admin/quiz' },
    { label: '총 회원 수',     value: stats?.userCount ?? '-',   color: '#a855f7', href: '/admin/members' },
    { label: '오늘 플레이',    value: stats?.todayPlays ?? '-',  color: '#22c55e', href: '/admin/stats' },
    { label: '7일 플레이',     value: stats?.weekPlays ?? '-',   color: '#f5a623', href: '/admin/stats' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>대시보드</h1>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map(c => (
          <Link key={c.label} href={c.href} style={{ textDecoration: 'none' }}>
            <div className="game-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{c.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: c.color }}>{c.value.toLocaleString()}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* 최근 가입 */}
        <div className="game-card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>최근 가입 회원</h2>
          {stats?.recentUsers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>없음</p>
          ) : stats?.recentUsers.map((u: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text)' }}>{u.name || u.nickname || '-'}</span>
              <span style={{ color: 'var(--text-muted)' }}>{u.parish || ''}</span>
            </div>
          ))}
        </div>

        {/* 최근 플레이 */}
        <div className="game-card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>최근 플레이</h2>
          {stats?.recentPlays.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>없음</p>
          ) : stats?.recentPlays.map((r: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text)' }}>{r.name || r.nickname || '-'}</span>
              <span style={{ color: 'var(--text-muted)' }}>{MODE_LABEL[r.mode] || r.mode} · {r.score}점</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
