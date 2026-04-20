import Link from 'next/link';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import NoticeDeleteButton from './NoticeDeleteButton';

export default async function NoticePage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/');

  let rows: any[] = [];
  let tableError = false;
  try {
    ({ rows } = await db.query(
      'SELECT notice_id, title, is_active, created_at FROM dbo.quiz_notice ORDER BY created_at DESC',
      []
    ));
  } catch {
    tableError = true;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>공지사항 관리</h1>
        <Link href="/admin/notice/new">
          <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>+ 새 공지</button>
        </Link>
      </div>

      {tableError && (
        <div style={{ background: 'rgba(233,69,96,0.08)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#e94560' }}>
          ⚠️ quiz_notice 테이블이 없습니다. DB에서 아래 SQL을 실행해주세요:<br />
          <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: 8, color: 'var(--text)', fontSize: '0.8rem', whiteSpace: 'pre' }}>
{`CREATE TABLE dbo.quiz_notice (
  notice_id  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
  title      NVARCHAR(200) NOT NULL,
  content    NVARCHAR(MAX) NOT NULL,
  is_active  BIT           NOT NULL DEFAULT 1,
  created_at DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2     NULL
);`}
          </code>
        </div>
      )}

      <div className="game-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['제목', '상태', '등록일', '관리'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {tableError ? '테이블 생성 후 이용 가능합니다' : '공지사항이 없습니다'}
              </td></tr>
            ) : rows.map((n: any) => (
              <tr key={n.notice_id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text)', fontWeight: 500 }}>{n.title}</td>
                <td style={{ padding: '0.65rem 1rem' }}>
                  <span style={{
                    background: n.is_active ? '#22c55e22' : 'var(--border)',
                    color: n.is_active ? '#22c55e' : 'var(--text-muted)',
                    padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700,
                  }}>
                    {n.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>
                  {n.created_at ? new Date(n.created_at).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td style={{ padding: '0.65rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Link href={`/admin/notice/${n.notice_id}/edit`}>
                      <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}>수정</button>
                    </Link>
                    <NoticeDeleteButton id={n.notice_id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
