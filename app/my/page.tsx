import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

async function getMyResults(userId: number) {
  const { rows } = await db.query(
    `SELECT TOP 10 mode, lv, score, correct_count, total_questions, time_sec, played_at
     FROM dbo.quiz_result
     WHERE user_id = @p1
     ORDER BY played_at DESC`,
    [userId]
  );
  return rows;
}

const MODE_LABEL: Record<string, string> = {
  ox: 'OX 퀴즈', chosung: '초성 퀴즈', survival: '서바이벌', random: '랜덤 퀴즈',
};

export default async function MyPage() {
  const session = await getSession().catch(() => null);
  if (!session) redirect('/login');

  const results = await getMyResults(session.user_id).catch(() => []);

  const rows: { label: string; value: string | null }[] = [
    { label: '이름',     value: session.name || null },
    { label: '세례명',   value: session.christen || null },
    { label: '축일',     value: session.chukmonth && session.chukday ? `${session.chukmonth}월 ${session.chukday}일` : null },
    { label: '이메일',   value: session.email || null },
    { label: '전화번호', value: session.phone_number || null },
    { label: '본당',     value: session.parish || session.church || null },
  ];

  return (
    <div style={{ maxWidth: 640, margin: '3rem auto', padding: '0 1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem', color: 'var(--text)' }}>내 정보</h1>

      {/* 프로필 카드 */}
      <div className="game-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #e94560, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0,
          }}>✝️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)' }}>
              {session.name || session.nickname}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
              굿뉴스 회원
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.filter(r => r.value).map(r => (
              <tr key={r.label} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.6rem 0', color: 'var(--text-muted)', fontSize: '0.875rem', width: 90 }}>
                  {r.label}
                </td>
                <td style={{ padding: '0.6rem 0', color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500 }}>
                  {r.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 최근 게임 기록 */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text)' }}>최근 게임 기록</h2>
      {results.length === 0 ? (
        <div className="game-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          아직 게임 기록이 없어요
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {results.map((r: any, i: number) => (
            <div key={i} className="game-card" style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: 70 }}>
                  {MODE_LABEL[r.mode] || r.mode}
                  {r.lv ? ` Lv.${r.lv}` : ''}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>
                  {r.score.toLocaleString()}점
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {r.correct_count}/{r.total_questions} 정답
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {new Date(r.played_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
