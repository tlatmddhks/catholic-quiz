'use client';
import { useState, useEffect, useCallback } from 'react';

interface Ranking {
  result_id: number;
  name: string;
  nickname: string;
  mode: string;
  lv: number;
  score: number;
  correct_count: number;
  total_questions: number;
  time_sec: number | null;
  played_at: string;
}

const MODE_LABEL: Record<string, string> = { ox: 'OX', chosung: '셔플', normal: '일반' };
const MODE_COLOR: Record<string, string> = { ox: '#22c55e', chosung: '#00d4ff', normal: '#a855f7' };

export default function RankingClient() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (mode) params.set('mode', mode);
    const res = await fetch(`/api/admin/ranking?${params}`);
    const data = await res.json();
    setRankings(data.rankings || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, mode]);

  useEffect(() => { fetchRankings(); }, [fetchRankings]);

  async function handleDelete(id: number) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    await fetch(`/api/admin/ranking/${id}`, { method: 'DELETE' });
    fetchRankings();
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      {/* 필터 */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <select value={mode} onChange={e => { setMode(e.target.value); setPage(1); }}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem' }}>
          <option value="">전체 유형</option>
          <option value="ox">OX</option>
          <option value="chosung">셔플</option>
          <option value="normal">일반</option>
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>총 {total.toLocaleString()}개</span>
      </div>

      <div className="game-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['순위','이름','유형','Lv','점수','정답','시간','플레이일','관리'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>불러오는 중...</td></tr>
            ) : rankings.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>기록이 없습니다</td></tr>
            ) : rankings.map((r, i) => {
              const rank = (page - 1) * 50 + i + 1;
              const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7c2f' : 'var(--text-muted)';
              const accuracy = r.total_questions > 0 ? Math.round(r.correct_count / r.total_questions * 100) : 0;
              return (
                <tr key={r.result_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: rankColor }}>{rank}</td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text)', fontWeight: 500 }}>{r.name || r.nickname || '-'}</td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <span style={{ background: (MODE_COLOR[r.mode] || '#888') + '22', color: MODE_COLOR[r.mode] || '#888', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>
                      {MODE_LABEL[r.mode] || r.mode}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{r.lv ? `Lv.${r.lv}` : '-'}</td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--accent)', fontWeight: 700 }}>{r.score.toLocaleString()}</td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{r.correct_count}/{r.total_questions} ({accuracy}%)</td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{r.time_sec != null ? `${r.time_sec}초` : '-'}</td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>
                    {r.played_at ? new Date(r.played_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <button onClick={() => handleDelete(r.result_id)} className="btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', color: '#e94560' }}>삭제</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
