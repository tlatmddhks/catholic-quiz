import db from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getRanking() {
  const { rows } = await db.query(
    `SELECT TOP 30
       u.nickname,
       MAX(r.score) AS best_score,
       SUM(r.correct_count) AS total_correct,
       COUNT(r.result_id) AS play_count
     FROM quiz_result r
     JOIN quiz_user u ON u.user_id = r.user_id
     GROUP BY u.user_id, u.nickname
     ORDER BY best_score DESC`
  );
  return rows;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default async function RankingPage() {
  const ranking = await getRanking();

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>명예의 전당</h1>
        <p style={{ color: 'var(--text-muted)' }}>최고 점수 기준 상위 30명</p>
      </div>

      {ranking.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</p>
          <p>아직 게임 기록이 없어요. 첫 번째 주인공이 되어보세요!</p>
          <Link href="/play?mode=random" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ marginTop: '1.5rem' }}>게임 시작하기</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ranking.map((row: any, i: number) => (
            <div
              key={i}
              className={`game-card ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}`}
              style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
            >
              {/* 순위 */}
              <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                {i < 3 ? (
                  <span style={{ fontSize: '1.8rem' }}>{MEDALS[i]}</span>
                ) : (
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-muted)' }}>{i + 1}</span>
                )}
              </div>

              {/* 닉네임 */}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: '1rem' }}>{row.nickname}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  정답 {row.total_correct?.toLocaleString()}개 · {row.play_count}판
                </p>
              </div>

              {/* 최고점수 */}
              <div className="score-badge" style={{ fontSize: '1.1rem' }}>
                {Number(row.best_score).toLocaleString()}점
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '1rem' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary">🏠 홈으로</button>
        </Link>
        <Link href="/play?mode=random" style={{ textDecoration: 'none' }}>
          <button className="btn-primary">🎮 게임 시작</button>
        </Link>
      </div>
    </div>
  );
}
