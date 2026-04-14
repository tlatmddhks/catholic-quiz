import { Suspense } from 'react';
import QuizGame from '@/components/QuizGame';

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>문제 불러오는 중...</p>
        </div>
      </div>
    }>
      <QuizGame />
    </Suspense>
  );
}
