import { notFound } from 'next/navigation';
import db from '@/lib/db';
import QuizForm from '../../QuizForm';

export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rows } = await db.query('SELECT * FROM dbo.quiz WHERE id = @p1', [parseInt(id)]);
  if (!rows[0]) notFound();

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>문제 수정 (ID: {id})</h1>
      <QuizForm initial={rows[0]} />
    </div>
  );
}
