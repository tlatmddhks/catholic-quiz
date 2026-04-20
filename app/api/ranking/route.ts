import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'all';

  let modeFilter = '';
  const params: any[] = [];
  if (mode !== 'all') {
    modeFilter = 'WHERE r.mode = @p1';
    params.push(mode);
  }

  const { rows } = await db.query(
    `SELECT TOP 20
       u.nickname,
       r.mode,
       MAX(r.score) AS best_score,
       SUM(r.correct_count) AS total_correct,
       COUNT(r.result_id) AS play_count,
       MAX(r.played_at) AS last_played
     FROM dbo.quiz_result r
     JOIN dbo.quiz_user u ON u.user_id = r.user_id
     ${modeFilter}
     GROUP BY u.user_id, u.nickname, r.mode
     ORDER BY best_score DESC`,
    params
  );

  return NextResponse.json({ ranking: rows });
}
