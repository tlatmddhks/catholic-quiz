'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BlockButton({ userId, isBlocked }: { userId: number; isBlocked: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const msg = isBlocked ? '이 회원의 차단을 해제하시겠습니까?' : '이 회원을 차단하시겠습니까? 로그인이 불가해집니다.';
    if (!confirm(msg)) return;
    setLoading(true);
    await fetch(`/api/admin/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blocked: !isBlocked }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={isBlocked ? 'btn-secondary' : 'btn-secondary'}
      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: isBlocked ? '#22c55e' : '#e94560', marginLeft: 'auto' }}>
      {loading ? '처리 중...' : isBlocked ? '차단 해제' : '차단'}
    </button>
  );
}
