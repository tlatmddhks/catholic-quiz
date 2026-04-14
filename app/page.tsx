import Link from 'next/link';
import db from '@/lib/db';

async function getStats() {
  const { rows } = await db.query('SELECT COUNT(*) AS total FROM dbo.quiz');
  return { total: rows[0]?.total ?? 0 };
}

export default async function HomePage() {
  const { total } = await getStats();

  const modes = [
    { key: 'ox',       label: 'OX 퀴즈',  icon: '⭕',  desc: '참/거짓을 맞춰보세요!',       color: '#22c55e', cls: 'ox' },
    { key: 'chosung',  label: '초성 퀴즈', icon: '🔤',  desc: '초성 힌트로 단어를 맞춰요!',  color: '#00d4ff', cls: 'cho' },
    { key: 'survival', label: '서바이벌',  icon: '❤️',  desc: '3번 틀리면 게임 오버!',       color: '#e94560', cls: 'surv' },
    { key: 'random',   label: '랜덤 퀴즈', icon: '🎲',  desc: '모든 유형이 랜덤으로!',       color: '#a855f7', cls: 'rand' },
  ];

  const levels = [
    { lv: 1, label: 'Lv.1', desc: '입문',  color: '#22c55e' },
    { lv: 2, label: 'Lv.2', desc: '초급',  color: '#00d4ff' },
    { lv: 3, label: 'Lv.3', desc: '중급',  color: '#f5a623' },
    { lv: 4, label: 'Lv.4', desc: '고급',  color: '#e94560' },
    { lv: 5, label: 'Lv.5', desc: '전문',  color: '#a855f7' },
    { lv: 6, label: 'Lv.6', desc: '마스터',color: '#ef4444' },
    { lv: 7, label: 'Lv.7', desc: '레전드',color: '#fbbf24' },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* 히어로 */}
      <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✝️</div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #e94560, #f5a623, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
        }}>
          가톨릭 신앙 퀴즈
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          신앙을 게임으로 — 총 <strong style={{ color: 'var(--accent)' }}>{total.toLocaleString()}</strong>개의 퀴즈 문제
        </p>
      </div>

      {/* 게임 모드 */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          🎮 게임 모드 선택
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          {modes.map((m) => (
            <Link key={m.key} href={`/play?mode=${m.key}`} style={{ textDecoration: 'none' }}>
              <div className={`mode-card ${m.cls}`}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{m.icon}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: m.color, marginBottom: '0.4rem' }}>{m.label}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 레벨별 도전 */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          ⚡ 레벨별 도전
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {levels.map((l) => (
            <Link key={l.lv} href={`/play?mode=random&lv=${l.lv}`} style={{ textDecoration: 'none' }}>
              <div className="game-card" style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `${l.color}22`, border: `2px solid ${l.color}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, color: l.color, fontSize: '0.85rem',
                }}>
                  {l.lv}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: l.color, fontSize: '0.95rem' }}>{l.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 하단 */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/ranking" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary">🏆 랭킹 보기</button>
        </Link>
        <Link href="/play?mode=random" style={{ textDecoration: 'none' }}>
          <button className="btn-primary">바로 시작하기 →</button>
        </Link>
      </div>
    </div>
  );
}
