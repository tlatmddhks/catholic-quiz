import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSession().catch(() => null);
  if (session) redirect('/');

  const { error } = await searchParams;
  const errorMsg =
    error === 'oauth'     ? '로그인 중 오류가 발생했습니다.' :
    error === 'invalid'   ? '인증 정보가 만료됐습니다. 다시 시도해 주세요.' :
    error === 'token'     ? '인증 처리 중 오류가 발생했습니다.' :
    error === 'userinfo'  ? '사용자 정보를 가져오지 못했습니다.' : null;

  return (
    <div style={{ maxWidth: 440, margin: '4rem auto', padding: '0 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✝️</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>가톨릭 퀴즈</h1>
        <p style={{ color: 'var(--text-muted)' }}>로그인하면 점수가 랭킹에 기록됩니다</p>
      </div>

      <div className="game-card" style={{ padding: '2rem' }}>
        {errorMsg && (
          <div style={{
            background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.4)',
            borderRadius: 8, padding: '0.75rem 1rem', color: '#e94560',
            fontSize: '0.9rem', marginBottom: '1.25rem', textAlign: 'center',
          }}>
            {errorMsg}
          </div>
        )}

        <a href="/api/auth/goodnews" style={{ textDecoration: 'none', display: 'block' }}>
          <button className="btn-primary" style={{
            width: '100%', padding: '0.875rem', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            굿뉴스 계정으로 로그인
          </button>
        </a>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          로그인 없이도 게임은 즐길 수 있지만,{' '}
          <strong style={{ color: 'var(--accent)' }}>랭킹 등록</strong>은 로그인이 필요해요.
        </p>
      </div>
    </div>
  );
}
