import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  let userRes;
  try {
    userRes = await db.query(
      `SELECT user_id, username, name, nickname, christen, chukmonth, chukday,
              email, phone_number, parish, church, is_blocked, created_at
       FROM dbo.quiz_user WHERE user_id = @p1`,
      [parseInt(id)]
    );
  } catch {
    userRes = await db.query(
      `SELECT user_id, username, name, nickname, christen, chukmonth, chukday,
              email, phone_number, parish, church, CAST(0 AS BIT) AS is_blocked, created_at
       FROM dbo.quiz_user WHERE user_id = @p1`,
      [parseInt(id)]
    );
  }

  const playsRes = await db.query(
    `SELECT TOP 50 result_id, mode, lv, score, correct_count, total_questions, time_sec, played_at
     FROM dbo.quiz_result WHERE user_id = @p1 ORDER BY played_at DESC`,
    [parseInt(id)]
  );

  if (!userRes.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user: userRes.rows[0], plays: playsRes.rows });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { is_blocked } = await req.json();
  try {
    await db.query('UPDATE dbo.quiz_user SET is_blocked=@p1 WHERE user_id=@p2', [is_blocked ? 1 : 0, parseInt(id)]);
  } catch {
    // is_blocked 컬럼 없음 (admin_schema_v2.sql 미적용)
    return NextResponse.json({ error: 'admin_schema_v2.sql을 먼저 SSMS에서 실행해주세요' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
