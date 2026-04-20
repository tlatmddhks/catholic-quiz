import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  const { mode, lv, score, total_questions, correct_count, time_sec } = await req.json();

  if (!session) {
    return NextResponse.json({ ok: true, saved: false });
  }

  const { rows: maxRows } = await db.query('SELECT ISNULL(MAX(result_id),0)+1 AS next_id FROM dbo.quiz_result');
  const resultId = maxRows[0].next_id;

  await db.query(
    `INSERT INTO dbo.quiz_result (result_id, user_id, mode, lv, score, total_questions, correct_count, time_sec, played_at)
     VALUES (@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8,GETDATE())`,
    [resultId, session.user_id, mode, lv || null, score, total_questions, correct_count, time_sec || null]
  );

  return NextResponse.json({ ok: true, saved: true });
}
