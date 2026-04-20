import { notFound, redirect } from 'next/navigation';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import BlockButton from './BlockButton';

const MODE_LABEL: Record<string, string> = { ox: 'OX', chosung: '초성', normal: '일반', survival: '서바이벌', random: '랜덤' };

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/');
  const { id } = await params;

  let userRes;
  try {
    userRes = await db.query(
      `SELECT user_id, username, name, nickname, christen, chukmonth, chukday,
              email, phone_number, parish, church, is_blocked, created_at
       FROM dbo.quiz_user WHERE user_id = @p1`,
      [parseInt(id)]
    );
  } catch {
    userRes = await db.query(
      `SELECT user_id, username, name, nickname, christen, chukmonth, chukday,
              email, phone_number, parish, church, CAST(0 AS BIT) AS is_blocked, created_at
       FROM dbo.quiz_user WHERE user_id = @p1`,
      [parseInt(id)]
    );
  }

  const playsRes = await db.query(
    `SELECT TOP 50 result_id, mode, lv, score, correct_count, total_questions, time_sec, played_at
     FROM dbo.quiz_result WHERE user_id = @p1 ORDER BY played_at DESC`,
    [parseInt(id)]
  );

  const user = userRes.rows[0];
  if (!user) notFound();
  const plays = playsRes.rows;

  const totalScore = plays.reduce((s: number, p: any) => s + p.score, 0);
  const avgAccuracy = plays.length > 0
    ? Math.round(plays.reduce((s: number, p: any) => s + (p.correct_count / (p.total_questions || 1)) * 100, 0) / plays.length)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <a href="/admin/members" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>← 회원 목록</a>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{user.name || user.nickname || user.username}</h1>
        {user.is_blocked ? (
          <span style={{ background: '#e9456022', color: '#e94560', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>차단됨</span>
        ) : null}
        <BlockButton userId={user.user_id} isBlocked={!!user.is_blocked} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* 기본 정보 */}
        <div className="game-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>기본 정보</h2>
          {[
            ['아이디', user.username],
            ['이름', user.name],
            ['세례명', user.christen],
            ['이메일', user.email],
            ['전화번호', user.phone_number],
            ['본당', user.parish || user.church],
            ['가입일', user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'],
          ].map(([label, value]) => (
            <div key={label as string} style={{ display: 'flex', gap: '1rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 70 }}>{label}</span>
              <span style={{ color: 'var(--text)' }}>{(value as string) || '-'}</span>
            </div>
          ))}
        </div>

        {/* 플레이 요약 */}
        <div className="game-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>플레이 요약</h2>
          {[
            ['총 플레이', `${plays.length}회`],
            ['누적 점수', totalScore.toLocaleString() + '점'],
            ['평균 정답률', `${avgAccuracy}%`],
          ].map(([label, value]) => (
            <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 플레이 기록 */}
      <div className="game-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.95rem' }}>최근 플레이 기록 (최대 50개)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['유형','Lv','점수','정답','시간','플레이일'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plays.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>플레이 기록 없음</td></tr>
            ) : plays.map((p: any) => (
              <tr key={p.result_id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text)' }}>{MODE_LABEL[p.mode] || p.mode}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{p.lv ? `Lv.${p.lv}` : '-'}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--accent)', fontWeight: 700 }}>{p.score.toLocaleString()}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{p.correct_count}/{p.total_questions}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{p.time_sec != null ? `${p.time_sec}초` : '-'}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>
                  {p.played_at ? new Date(p.played_at).toLocaleDateString('ko-KR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
