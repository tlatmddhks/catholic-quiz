import db from '@/lib/db';
import Link from 'next/link';

async function getDashboardStats() {
  const [quizCount, userCount, todayPlays, weekPlays, recentUsers, recentPlays, quizByType, quizByLv, recentQuiz] = await Promise.all([
    db.query('SELECT CAST(COUNT(*) AS INT) AS cnt FROM dbo.quiz'),
    db.query('SELECT CAST(COUNT(*) AS INT) AS cnt FROM dbo.quiz_user'),
    db.query("SELECT CAST(COUNT(*) AS INT) AS cnt FROM dbo.quiz_result WHERE played_at >= CAST(GETDATE() AS DATE)"),
    db.query("SELECT CAST(COUNT(*) AS INT) AS cnt FROM dbo.quiz_result WHERE played_at >= DATEADD(day,-7,GETDATE())"),
    db.query('SELECT TOP 5 name, nickname, parish, created_at FROM dbo.quiz_user ORDER BY created_at DESC'),
    db.query(`SELECT TOP 5 u.name, u.nickname, r.mode, r.score, r.played_at
              FROM dbo.quiz_result r JOIN dbo.quiz_user u ON u.user_id = r.user_id
              ORDER BY r.played_at DESC`),
    db.query(`SELECT
        CAST(SUM(CASE WHEN ox='Y' THEN 1 ELSE 0 END) AS INT) AS ox_cnt,
        CAST(SUM(CASE WHEN shuffle='Y' THEN 1 ELSE 0 END) AS INT) AS shuffle_cnt,
        CAST(SUM(CASE WHEN normal='Y' THEN 1 ELSE 0 END) AS INT) AS normal_cnt,
        CAST(SUM(CASE WHEN survival_yn='Y' THEN 1 ELSE 0 END) AS INT) AS survival_cnt
      FROM dbo.quiz`),
    db.query(`SELECT lv, CAST(COUNT(*) AS INT) AS cnt FROM dbo.quiz GROUP BY lv ORDER BY lv`),
    db.query(`SELECT TOP 10 id, area, lv, pt, question, right_word, ox, shuffle, normal, survival_yn FROM dbo.quiz ORDER BY id DESC`),
  ]);
  return {
    quizCount: quizCount.rows[0]?.cnt ?? 0,
    userCount: userCount.rows[0]?.cnt ?? 0,
    todayPlays: todayPlays.rows[0]?.cnt ?? 0,
    weekPlays: weekPlays.rows[0]?.cnt ?? 0,
    recentUsers: recentUsers.rows,
    recentPlays: recentPlays.rows,
    byType: quizByType.rows[0] ?? {},
    byLv: quizByLv.rows,
    recentQuiz: recentQuiz.rows,
  };
}

const MODE_LABEL: Record<string, string> = {
  ox: 'OX', chosung: '셔플', survival: '서바이벌', random: '랜덤', normal: '일반',
};

const LV_LABEL: Record<number, string> = { 1:'입문',2:'초급',3:'중급',4:'고급',5:'전문',6:'마스터',7:'레전드' };
const LV_COLOR: Record<number, string> = { 1:'#22c55e',2:'#00d4ff',3:'#f5a623',4:'#e94560',5:'#a855f7',6:'#ef4444',7:'#fbbf24' };

function getQuizType(q: any) {
  if (q.shuffle === 'Y') return { label: '셔플', color: '#f5a623' };
  if (q.ox === 'Y') return { label: 'OX', color: '#22c55e' };
  return { label: '일반', color: '#a855f7' };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats().catch(() => null);

  const topCards = [
    { label: '총 문제 수',  value: stats?.quizCount ?? '-',  color: '#00d4ff', href: '/admin/quiz' },
    { label: '총 회원 수',  value: stats?.userCount ?? '-',  color: '#a855f7', href: '/admin/members' },
    { label: '오늘 플레이', value: stats?.todayPlays ?? '-', color: '#22c55e', href: '/admin/stats' },
    { label: '7일 플레이',  value: stats?.weekPlays ?? '-',  color: '#f5a623', href: '/admin/stats' },
  ];

  const typeCards = [
    { label: 'OX 문제',   value: stats?.byType?.ox_cnt ?? 0,       color: '#22c55e' },
    { label: '셔플 문제', value: stats?.byType?.shuffle_cnt ?? 0,   color: '#f5a623' },
    { label: '일반 문제', value: stats?.byType?.normal_cnt ?? 0,    color: '#a855f7' },
    { label: '서바이벌',  value: stats?.byType?.survival_cnt ?? 0,  color: '#e94560' },
  ];

  const maxLvCnt = Math.max(...(stats?.byLv.map((r: any) => r.cnt) ?? [1]), 1);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>대시보드</h1>

      {/* 상단 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {topCards.map(c => (
          <Link key={c.label} href={c.href} style={{ textDecoration: 'none' }}>
            <div className="game-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{c.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: c.color }}>{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* 문제 유형별 현황 */}
      <div className="game-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>문제 유형별 현황</h2>
          <Link href="/admin/quiz" style={{ textDecoration: 'none', fontSize: '0.8rem', color: 'var(--accent)' }}>전체 보기 →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {typeCards.map(c => (
            <div key={c.label} style={{
              background: `${c.color}12`, border: `1px solid ${c.color}33`,
              borderRadius: 12, padding: '1rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: c.color }}>{c.value.toLocaleString()}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 레벨별 문제 수 */}
      <div className="game-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>레벨별 문제 수</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(stats?.byLv ?? []).map((r: any) => (
            <div key={r.lv} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`lv-badge lv-${r.lv}`} style={{ width: 80, textAlign: 'center', flexShrink: 0 }}>
                Lv.{r.lv} {LV_LABEL[r.lv]}
              </span>
              <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 5,
                  background: LV_COLOR[r.lv] ?? 'var(--accent)',
                  width: `${Math.round((r.cnt / maxLvCnt) * 100)}%`,
                  transition: 'width 0.4s',
                }} />
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: LV_COLOR[r.lv], width: 36, textAlign: 'right', flexShrink: 0 }}>
                {r.cnt}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 등록 문제 */}
      <div className="game-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>최근 등록 문제 (최근 10개)</h2>
          <Link href="/admin/quiz" style={{ textDecoration: 'none', fontSize: '0.8rem', color: 'var(--accent)' }}>전체 보기 →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['#', '유형', '레벨', '문제', '정답', '서바이벌', '포인트', ''].map(h => (
                  <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats?.recentQuiz ?? []).map((q: any) => {
                const t = getQuizType(q);
                return (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.45rem 0.6rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{q.id}</td>
                    <td style={{ padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <span style={{ background: t.color + '22', color: t.color, padding: '0.15rem 0.5rem', borderRadius: 5, fontSize: '0.72rem', fontWeight: 700 }}>{t.label}</span>
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <span className={`lv-badge lv-${q.lv}`}>Lv.{q.lv} {LV_LABEL[q.lv]}</span>
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                      {q.area ? <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.4rem' }}>[{q.area}]</span> : null}
                      {q.question}
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', color: '#22c55e', fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {q.right_word || '-'}
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>
                      {q.survival_yn === 'Y'
                        ? <span style={{ color: '#e94560', fontSize: '0.75rem', fontWeight: 700 }}>●</span>
                        : <span style={{ color: 'var(--border)', fontSize: '0.75rem' }}>○</span>}
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', color: '#f5a623', fontWeight: 600, textAlign: 'right' }}>
                      {q.pt ?? '-'}
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <Link href={`/admin/quiz/${q.id}/edit`} style={{ textDecoration: 'none', color: 'var(--accent)', fontSize: '0.78rem' }}>수정 →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 최근 가입 + 최근 플레이 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="game-card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>최근 가입 회원</h2>
          {!stats?.recentUsers.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>없음</p>
          ) : stats.recentUsers.map((u: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text)' }}>{u.name || u.nickname || '-'}</span>
              <span style={{ color: 'var(--text-muted)' }}>{u.parish || ''}</span>
            </div>
          ))}
        </div>

        <div className="game-card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>최근 플레이</h2>
          {!stats?.recentPlays.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>없음</p>
          ) : stats.recentPlays.map((r: any, i: number) => (
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
