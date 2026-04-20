import { notFound } from 'next/navigation';
import db from '@/lib/db';
import NoticeForm from '../../NoticeForm';

export default async function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rows } = await db.query('SELECT * FROM dbo.quiz_notice WHERE notice_id = @p1', [parseInt(id)]);
  if (!rows[0]) notFound();

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>공지사항 수정</h1>
      <NoticeForm initial={rows[0]} />
    </div>
  );
}
