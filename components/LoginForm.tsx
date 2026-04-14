'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: tab, username, password, nickname }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '오류가 발생했습니다.'); return; }
      router.push('/');
      router.refresh();
    } catch {
      setError('서버 연결 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid var(--border)',
    borderRadius: 10, color: 'var(--text)',
    fontSize: '1rem', outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="game-card" style={{ padding: '2rem' }}>
      {/* 탭 */}
      <div style={{ display: 'flex', marginBottom: '1.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
        {(['login', 'register'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); }}
            style={{
              flex: 1, padding: '0.625rem', borderRadius: 8, border: 'none',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t ? 'var(--primary)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-muted)',
              boxShadow: tab === t ? 'var(--glow)' : 'none',
            }}
          >
            {t === 'login' ? '로그인' : '회원가입'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            아이디
          </label>
          <input
            style={inputStyle} value={username} onChange={e => setUsername(e.target.value)}
            placeholder="아이디 입력" required autoComplete="username"
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {tab === 'register' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              닉네임
            </label>
            <input
              style={inputStyle} value={nickname} onChange={e => setNickname(e.target.value)}
              placeholder="게임에서 표시될 이름" required
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            비밀번호
          </label>
          <input
            type="password" style={inputStyle} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호 입력" required autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {error && (
          <div style={{ background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.4)', borderRadius: 8, padding: '0.75rem 1rem', color: '#e94560', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.875rem', marginTop: '0.5rem' }}>
          {loading ? '처리 중...' : tab === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        로그인 없이도 게임은 즐길 수 있지만,{' '}
        <strong style={{ color: 'var(--accent)' }}>랭킹 등록</strong>은 로그인이 필요해요.
      </p>
    </div>
  );
}
