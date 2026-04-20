import db from '@/lib/db';
import Link from 'next/link';

interface Props { searchParams: Promise<{ page?: string; q?: string }> }

export default async function MembersPage({ searchParams }: Props) {
  const { page: pageStr = '1', q = '' } = await searchParams;
  const page = Math.max(1, parseInt(pageStr));
  const limit = 20;
  const offset = (page - 1) * limit;

  const whereParams: any[] = [];
  const where = q ? `WHERE u.name LIKE @p1 OR u.nickname LIKE @p2 OR u.parish LIKE @p3` : '';
  if (q) whereParams.push(`%${q}%`, `%${q}%`, `%${q}%`);

  const [listRes, countRes] = await Promise.all([
    db.query(
      `SELECT u.user_id, u.name, u.nickname, u.christen, u.parish, u.church, u.email, u.is_blocked, u.created_at,
              CAST(ISNULL(COUNT(r.result_id),0) AS INT) AS play_count
       FROM dbo.quiz_user u
       LEFT JOIN dbo.quiz_result r ON r.user_id = u.user_id
       ${where}
       GROUP BY u.user_id, u.name, u.nickname, u.christen, u.parish, u.church, u.email, u.is_blocked, u.created_at
       ORDER BY u.created_at DESC
       OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`,
      whereParams
    ),
    db.query(`SELECT CAST(COUNT(*) AS INT) AS total FROM dbo.quiz_user u ${where}`, whereParams),
  ]);

  const members = listRes.rows;
  const total = countRes.rows[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>회원 관리</h1>

      <form method="get" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input name="q" defaultValue={q} placeholder="이름, 닉네임, 본당 검색..."
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem', width: 240 }} />
        <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>검색</button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', alignSelf: 'center' }}>총 {total.toLocaleString()}명</span>
      </form>

      <div className="game-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['이름','세례명','본당/성당','이메일','플레이수','가입일','상태',''].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>회원이 없습니다</td></tr>
            ) : members.map((m: any) => (
              <tr key={m.user_id} style={{ borderBottom: '1px solid var(--border)', opacity: m.is_blocked ? 0.6 : 1 }}>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text)', fontWeight: 500 }}>{m.name || m.nickname || '-'}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{m.christen || '-'}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{m.parish || m.church || '-'}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{m.email || '-'}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--accent)', fontWeight: 700 }}>{m.play_count}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>
                  {m.created_at ? new Date(m.created_at).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td style={{ padding: '0.65rem 1rem' }}>
                  {m.is_blocked ? (
                    <span style={{ background: '#e9456022', color: '#e94560', padding: '0.15rem 0.5rem', borderRadius: 5, fontSize: '0.75rem', fontWeight: 700 }}>차단</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>정상</span>
                  )}
                </td>
                <td style={{ padding: '0.65rem 1rem' }}>
                  <Link href={`/admin/members/${m.user_id}`}>
                    <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}>상세</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
          {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 4, totalPages - 9));
            const p = start + i;
            return (
              <a key={p} href={`?page=${p}${q ? `&q=${q}` : ''}`}
                className={p === page ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem', textDecoration: 'none', borderRadius: 8 }}>{p}</a>
            );
          })}
        </div>
      )}
    </div>
  );
}
