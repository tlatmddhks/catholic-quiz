'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NoticeData { notice_id?: number; title?: string; content?: string; is_active?: number | boolean }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem',
};

export default function NoticeForm({ initial }: { initial?: NoticeData }) {
  const router = useRouter();
  const isEdit = !!initial?.notice_id;
  const [form, setForm] = useState({
    title: initial?.title || '',
    content: initial?.content || '',
    is_active: initial?.is_active !== undefined ? !!initial.is_active : true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { setError('제목과 내용은 필수입니다.'); return; }
    setLoading(true); setError('');

    const url = isEdit ? `/api/admin/notice/${initial!.notice_id}` : '/api/admin/notice';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('저장 실패');
      router.push('/admin/notice');
      router.refresh();
    } catch {
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
      {error && <div style={{ color: '#e94560', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>제목</label>
        <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="공지사항 제목" />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>내용</label>
        <textarea style={{ ...inputStyle, minHeight: 160, resize: 'vertical' }}
          value={form.content} onChange={e => set('content', e.target.value)} placeholder="공지사항 내용을 입력하세요" />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', fontSize: '0.875rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
        게임 화면에 공지 표시 (활성)
      </label>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.7rem 1.5rem' }}>
          {loading ? '저장 중...' : isEdit ? '수정 저장' : '등록'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()} style={{ padding: '0.7rem 1.2rem' }}>취소</button>
      </div>
    </form>
  );
}
