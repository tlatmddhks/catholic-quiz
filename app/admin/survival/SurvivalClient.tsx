'use client';
import { useState, useEffect, useCallback } from 'react';

interface Quiz {
  id: number; area: string; lv: number; type: number; question: string;
  right_word: string; ox: string; shuffle: string; survival_yn: string;
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  ox:      { label: 'OX',  color: '#22c55e' },
  chosung: { label: '초성', color: '#00d4ff' },
  normal:  { label: '일반', color: '#a855f7' },
};

function getType(q: Quiz) {
  if (q.type === 3 || q.shuffle === 'Y') return 'chosung';
  if (q.ox === 'Y') return 'ox';
  return 'normal';
}

export default function SurvivalClient() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'survival'>('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filter === 'survival') params.set('type', ''); // filter by survival separately
    if (q) params.set('q', q);
    params.set('limit', '30');
    const res = await fetch(`/api/admin/quiz?${params}`);
    const data = await res.json();
    const list: Quiz[] = data.quizzes || [];
    const filtered = filter === 'survival' ? list.filter(qz => qz.survival_yn === 'Y') : list;
    setQuizzes(filtered);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filter, q]);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  async function toggleSurvival(id: number, current: string) {
    setToggling(id);
    await fetch(`/api/admin/quiz/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ survival_yn: current === 'Y' ? 'N' : 'Y' }),
    });
    setQuizzes(prev => prev.map(qz => qz.id === id ? { ...qz, survival_yn: current === 'Y' ? 'N' : 'Y' } : qz));
    setToggling(null);
  }

  const survivalCount = quizzes.filter(q => q.survival_yn === 'Y').length;

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="문제 검색..."
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem', width: 200 }} />
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['all','survival'] as const).map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={filter === f ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
              {f === 'all' ? '전체' : '서바이벌만'}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.875rem', color: '#e94560', fontWeight: 700 }}>
          서바이벌 포함: {survivalCount}개 (이 페이지)
        </span>
      </div>

      <div className="game-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID','유형','Lv','영역','문제','정답','서바이벌'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>불러오는 중...</td></tr>
            ) : quizzes.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>문제가 없습니다</td></tr>
            ) : quizzes.map(quiz => {
              const t = getType(quiz);
              const { label, color } = TYPE_LABEL[t];
              const isSurv = quiz.survival_yn === 'Y';
              return (
                <tr key={quiz.id} style={{ borderBottom: '1px solid var(--border)', background: isSurv ? 'rgba(233,69,96,0.04)' : undefined }}>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{quiz.id}</td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <span style={{ background: color + '22', color, padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>{label}</span>
                  </td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>Lv.{quiz.lv}</td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{quiz.area || '-'}</td>
                  <td style={{ padding: '0.65rem 1rem', maxWidth: 280 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{quiz.question}</div>
                  </td>
                  <td style={{ padding: '0.65rem 1rem', maxWidth: 100 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{quiz.right_word}</div>
                  </td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <button
                      onClick={() => toggleSurvival(quiz.id, quiz.survival_yn)}
                      disabled={toggling === quiz.id}
                      style={{
                        padding: '0.25rem 0.75rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                        background: isSurv ? '#e94560' : 'var(--border)',
                        color: isSurv ? '#fff' : 'var(--text-muted)',
                        opacity: toggling === quiz.id ? 0.5 : 1,
                      }}>
                      {isSurv ? '포함 ✓' : '제외'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {Math.ceil(total / 30) > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
          {Array.from({ length: Math.min(10, Math.ceil(total / 30)) }, (_, i) => {
            const totalPages = Math.ceil(total / 30);
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
