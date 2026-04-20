import { requireAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import db from '@/lib/db';

export default async function StatsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/');

  const [modeRes, lvRes, dailyRes, accuracyRes] = await Promise.all([
    db.query(`
      SELECT mode, CAST(COUNT(*) AS INT) AS cnt
      FROM dbo.quiz_result
      GROUP BY mode
    `, []),
    db.query(`
      SELECT lv, CAST(COUNT(*) AS INT) AS cnt
      FROM dbo.quiz_result
      WHERE lv IS NOT NULL
      GROUP BY lv
      ORDER BY lv
    `, []),
    db.query(`
      SELECT CAST(CONVERT(date, played_at) AS NVARCHAR(10)) AS day,
             CAST(COUNT(*) AS INT) AS cnt
      FROM dbo.quiz_result
      WHERE played_at >= DATEADD(day, -6, CAST(GETDATE() AS DATE))
      GROUP BY CAST(CONVERT(date, played_at) AS NVARCHAR(10))
      ORDER BY day
    `, []),
    db.query(`
      SELECT
        CAST(COUNT(*) AS INT) AS total,
        CAST(SUM(correct_count) AS INT) AS correct,
        CAST(SUM(total_questions) AS INT) AS total_q
      FROM dbo.quiz_result
    `, []),
  ]);

  const modeMap: Record<string, number> = {};
  for (const r of modeRes.rows) modeMap[r.mode] = r.cnt;
  const lvStats: { lv: number; cnt: number }[] = lvRes.rows;
  const daily: { day: string; cnt: number }[] = dailyRes.rows;
  const acc = accuracyRes.rows[0] || { total: 0, correct: 0, total_q: 0 };
  const accuracy = acc.total_q > 0 ? Math.round((acc.correct / acc.total_q) * 100) : 0;

  const modeTotal = Object.values(modeMap).reduce((s, v) => s + v, 0);
  const modeItems = [
    { label: 'OX 퀴즈', key: 'ox', color: '#22c55e' },
    { label: '초성 퀴즈', key: 'chosung', color: '#00d4ff' },
    { label: '일반 퀴즈', key: 'normal', color: '#a855f7' },
  ];

  const maxDaily = Math.max(...daily.map(d => d.cnt), 1);
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>통계</h1>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: '전체 플레이', value: (acc.total || 0).toLocaleString(), color: '#00d4ff' },
          { label: '정답률', value: `${accuracy}%`, color: '#22c55e' },
          { label: '오늘 플레이', value: (daily.find(d => d.day === todayStr)?.cnt || 0).toLocaleString(), color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} className="game-card" style={{ padding: '1.2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* 유형별 분포 */}
        <div className="game-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.2rem' }}>유형별 플레이</h2>
          {modeItems.map(m => {
            const val = modeMap[m.key] || 0;
            return (
              <div key={m.key} style={{ marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text)' }}>{m.label}</span>
                  <span style={{ color: m.color, fontWeight: 700 }}>
                    {val.toLocaleString()} ({modeTotal > 0 ? Math.round(val / modeTotal * 100) : 0}%)
                  </span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 4, height: 8 }}>
                  <div style={{ background: m.color, borderRadius: 4, height: 8, width: `${modeTotal > 0 ? (val / modeTotal * 100) : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 레벨별 분포 */}
        <div className="game-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.2rem' }}>레벨별 플레이</h2>
          {[1,2,3,4,5,6,7].map(lv => {
            const stat = lvStats.find(s => s.lv === lv);
            const cnt = stat?.cnt || 0;
            const lvTotal = lvStats.reduce((s, r) => s + r.cnt, 0);
            return (
              <div key={lv} style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 3 }}>
                  <span style={{ color: 'var(--text)' }}>Lv.{lv}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{cnt.toLocaleString()}</span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 4, height: 6 }}>
                  <div style={{ background: 'var(--accent)', borderRadius: 4, height: 6, width: `${lvTotal > 0 ? (cnt / lvTotal * 100) : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7일 플레이 추이 */}
      <div className="game-card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.2rem' }}>최근 7일 플레이 추이</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: 160 }}>
          {(() => {
            const days: string[] = [];
            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              days.push(d.toISOString().slice(0, 10));
            }
            return days.map(day => {
              const cnt = daily.find(d => d.day === day)?.cnt || 0;
              const h = Math.round((cnt / maxDaily) * 100);
              const label = day.slice(5).replace('-', '/');
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, minHeight: 16 }}>{cnt > 0 ? cnt : ''}</span>
                  <div style={{ width: '100%', background: 'var(--border)', borderRadius: '4px 4px 0 0', height: 100, position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--accent)', borderRadius: '4px 4px 0 0', height: `${h}%` }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
