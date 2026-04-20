import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import NoticeForm from '../../NoticeForm';

export default async function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/');

  const { id } = await params;
  let notice: any = null;
  try {
    const { rows } = await db.query('SELECT * FROM dbo.quiz_notice WHERE notice_id = @p1', [parseInt(id)]);
    notice = rows[0];
  } catch {
    notFound();
  }
  if (!notice) notFound();

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>공지사항 수정</h1>
      <NoticeForm initial={notice} />
    </div>
  );
}
