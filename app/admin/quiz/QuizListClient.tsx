'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Quiz {
  id: number; area: string; lv: number; pt: number; type: number; question: string;
  right_word: string; ox: string; shuffle: string; normal: string; survival_yn: string;
}

const TYPE_BADGE: Record<string, string> = { ox: 'OX', chosung: '셔플', normal: '일반' };

function getType(q: Quiz): string {
  if (q.shuffle === 'Y') return 'chosung';
  if (q.ox === 'Y') return 'ox';
  return 'normal';
}

export default function QuizListClient({ initialParams }: { initialParams: any }) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(initialParams.page || '1'));
  const [type, setType] = useState(initialParams.type || '');
  const [lv, setLv] = useState(initialParams.lv || '');
  const [q, setQ] = useState(initialParams.q || '');
  const [loading, setLoading] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (type) params.set('type', type);
    if (lv)   params.set('lv', lv);
    if (q)    params.set('q', q);
    const res = await fetch(`/api/admin/quiz?${params}`);
    const data = await res.json();
    setQuizzes(data.quizzes || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, type, lv, q]);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  async function handleDelete(id: number) {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/admin/quiz/${id}`, { method: 'DELETE' });
    fetchQuizzes();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {/* 필터 */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="문제 검색..."
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem', width: 200 }} />
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem' }}>
          <option value="">전체 유형</option>
          <option value="ox">OX</option>
          <option value="chosung">셔플</option>
          <option value="normal">일반</option>
        </select>
        <select value={lv} onChange={e => { setLv(e.target.value); setPage(1); }}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem' }}>
          <option value="">전체 레벨</option>
          {[1,2,3,4,5,6,7].map(v => <option key={v} value={v}>Lv.{v}</option>)}
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', alignSelf: 'center' }}>총 {total.toLocaleString()}개</span>
      </div>

      {/* 테이블 */}
      <div className="game-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID','유형','Lv','영역','문제','정답','서바','관리'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>불러오는 중...</td></tr>
            ) : quizzes.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>문제가 없습니다</td></tr>
            ) : quizzes.map(quiz => {
              const t = getType(quiz);
              const colors: Record<string,string> = { ox: '#22c55e', chosung: '#00d4ff', normal: '#a855f7' };
              return (
                <tr key={quiz.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{quiz.id}</td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <span style={{ background: colors[t]+'22', color: colors[t], padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>
                      {TYPE_BADGE[t]}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>Lv.{quiz.lv}</td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{quiz.area || '-'}</td>
                  <td style={{ padding: '0.65rem 1rem', maxWidth: 300 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{quiz.question}</div>
                  </td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text)', maxWidth: 120 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quiz.right_word}</div>
                  </td>
                  <td style={{ padding: '0.65rem 1rem', color: quiz.survival_yn === 'Y' ? '#22c55e' : 'var(--text-muted)' }}>
                    {quiz.survival_yn === 'Y' ? '✓' : '-'}
                  </td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Link href={`/admin/quiz/${quiz.id}/edit`}>
                        <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}>수정</button>
                      </Link>
                      <button onClick={() => handleDelete(quiz.id)} className="btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', color: '#e94560' }}>삭제</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
          {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 4, totalPages - 9));
            const p = start + i;
            return (
              <button key={p} onClick={() => setPage(p)} className={p === page ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem' }}>{p}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}
