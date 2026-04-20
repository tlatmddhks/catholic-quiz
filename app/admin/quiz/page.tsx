import Link from 'next/link';
import QuizListClient from './QuizListClient';

interface Props { searchParams: Promise<{ page?: string; type?: string; lv?: string; q?: string }> }

export default async function AdminQuizPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>문제 관리</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/admin/quiz/new?mode=ox"><button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>+ OX 등록</button></Link>
          <Link href="/admin/quiz/new?mode=chosung"><button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>+ 초성 등록</button></Link>
          <Link href="/admin/quiz/new?mode=normal"><button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>+ 일반 등록</button></Link>
        </div>
      </div>
      <QuizListClient initialParams={sp} />
    </div>
  );
}
