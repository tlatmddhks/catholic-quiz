import Link from 'next/link';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { checkIsAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const [quizRes, noticeRes] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM dbo.quiz'),
      db.query('SELECT TOP 1 title, content FROM dbo.quiz_notice WHERE is_active=1 ORDER BY created_at DESC').catch(() => ({ rows: [] })),
    ]);
    return {
      total: quizRes.rows[0]?.total ?? 0,
      notice: noticeRes.rows[0] || null,
    };
  } catch {
    return { total: 0, notice: null };
  }
}

export default async function HomePage() {
  const { total, notice } = await getStats();
  const session = await getSession().catch(() => null);
  const isAdmin = session ? await checkIsAdmin(session.username).catch(() => false) : false;


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
      {/* 공지사항 배너 */}
      {notice && (
        <div style={{
          background: 'rgba(233,69,96,0.08)', border: '1px solid rgba(233,69,96,0.35)',
          borderRadius: 16, padding: '1.5rem 1.75rem', marginBottom: '2.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📢</span>
            <strong style={{ color: '#e94560', fontSize: '1.15rem', fontWeight: 800 }}>{notice.title}</strong>
          </div>
          <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{notice.content}</p>
        </div>
      )}

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
        {/* 6열 그리드: 1행 3카드(각 2열), 2행 2카드(각 2열, 1열씩 밀어 가운데 정렬) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
          <Link href="/play?mode=normal" style={{ textDecoration: 'none', gridColumn: '1 / 3' }}>
            <div className="mode-card mode-normal" style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.4rem' }}>
              <div style={{ fontSize: '2.2rem' }}>📖</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#22c55e', margin: 0 }}>일반 퀴즈</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>4지선다 객관식</p>
            </div>
          </Link>
          <Link href="/play?mode=ox" style={{ textDecoration: 'none', gridColumn: '3 / 5' }}>
            <div className="mode-card mode-ox" style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.4rem' }}>
              <div style={{ fontSize: '2.2rem' }}>⭕</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#00d4ff', margin: 0 }}>OX 퀴즈</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>참 / 거짓 판단</p>
            </div>
          </Link>
          <Link href="/play?mode=chosung" style={{ textDecoration: 'none', gridColumn: '5 / 7' }}>
            <div className="mode-card mode-chosung" style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.4rem' }}>
              <div style={{ fontSize: '2.2rem' }}>🔀</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f5a623', margin: 0 }}>셔플 퀴즈</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>섞인 단어 맞추기</p>
            </div>
          </Link>
          <Link href="/play?mode=random" style={{ textDecoration: 'none', gridColumn: '2 / 4' }}>
            <div className="mode-card mode-random" style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.4rem' }}>
              <div style={{ fontSize: '2.2rem' }}>🎲</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#a855f7', margin: 0 }}>랜덤 퀴즈</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>전체 무작위 출제</p>
            </div>
          </Link>
          <Link href="/play?mode=survival" style={{ textDecoration: 'none', gridColumn: '4 / 6' }}>
            <div className="mode-card mode-survival" style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.4rem' }}>
              <div style={{ fontSize: '2.2rem' }}>💀</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444', margin: 0 }}>서바이벌</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>틀리면 끝!</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 레벨별 도전 */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          ⚡ 레벨별 도전
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
          {levels.map((l) => (
            <Link key={l.lv} href={`/play?mode=random&lv=${l.lv}`} style={{ textDecoration: 'none' }}>
              <div className="lv-card" style={{
                background: `linear-gradient(160deg, ${l.color}18 0%, ${l.color}08 100%)`,
                border: `1px solid ${l.color}44`,
                boxShadow: `0 2px 12px ${l.color}18`,
              }}>
                <div style={{
                  fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em',
                  background: `linear-gradient(135deg, ${l.color}, ${l.color}bb)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {l.label}
                </div>
                <div style={{
                  fontSize: '0.72rem', fontWeight: 700, color: l.color,
                  background: `${l.color}22`, borderRadius: 20,
                  padding: '0.15rem 0.55rem', letterSpacing: '0.02em',
                }}>
                  {l.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 하단 */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/ranking" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary">🏆 랭킹 보기</button>
        </Link>
        <Link href="/play?mode=random" style={{ textDecoration: 'none' }}>
          <button className="btn-primary">바로 시작하기 →</button>
        </Link>
        {isAdmin && (
          <Link href="/play?mode=test" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ color: '#f5a623', borderColor: 'rgba(245,166,35,0.4)' }}>
              🧪 테스트 문제 풀기
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
