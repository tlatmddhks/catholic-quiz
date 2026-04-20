import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  if (!q.trim()) return NextResponse.json({ members: [] });

  const { rows } = await db.query(
    `SELECT TOP 10 user_id, username, name, nickname
     FROM dbo.quiz_user
     WHERE name LIKE @p1 OR nickname LIKE @p2 OR username LIKE @p3`,
    [`%${q}%`, `%${q}%`, `%${q}%`]
  );

  return NextResponse.json({ members: rows });
}
