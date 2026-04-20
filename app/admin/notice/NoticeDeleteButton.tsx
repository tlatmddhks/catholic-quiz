'use client';
import { useRouter } from 'next/navigation';

export default function NoticeDeleteButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('공지를 삭제하시겠습니까?')) return;
    await fetch(`/api/admin/notice/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="btn-secondary"
      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', color: '#e94560' }}>삭제</button>
  );
}
