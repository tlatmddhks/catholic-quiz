import { requireAdmin } from '@/lib/admin';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const mode = searchParams.get('mode') || '';
  const limit = 50;
  const offset = (page - 1) * limit;

  const params: any[] = [];
  let where = '';
  if (mode) {
    where = 'WHERE r.mode = @p1';
    params.push(mode);
  }

  const offsetParam = params.length + 1;
  const limitParam = params.length + 2;

  const [listRes, countRes] = await Promise.all([
    db.query(`
      SELECT r.result_id, u.name, u.nickname, r.mode, r.lv, r.score,
             r.correct_count, r.total_questions, r.time_sec, r.played_at
      FROM dbo.quiz_result r
      JOIN dbo.quiz_user u ON u.user_id = r.user_id
      ${where}
      ORDER BY r.score DESC, r.correct_count DESC, r.played_at DESC
      OFFSET @p${offsetParam} ROWS FETCH NEXT @p${limitParam} ROWS ONLY
    `, [...params, offset, limit]),
    db.query(`
      SELECT CAST(COUNT(*) AS INT) AS total
      FROM dbo.quiz_result r ${where}
    `, params),
  ]);

  return NextResponse.json({ rankings: listRes.rows, total: countRes.rows[0]?.total ?? 0 });
}
