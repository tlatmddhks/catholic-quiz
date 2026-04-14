import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div style={{ maxWidth: 440, margin: '4rem auto', padding: '0 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✝️</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>가톨릭 퀴즈</h1>
        <p style={{ color: 'var(--text-muted)' }}>로그인하면 점수가 랭킹에 기록됩니다</p>
      </div>
      <LoginForm />
    </div>
  );
}
