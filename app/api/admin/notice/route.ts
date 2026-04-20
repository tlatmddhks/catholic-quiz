import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { rows } = await db.query(
    'SELECT notice_id, title, content, is_active, created_at, updated_at FROM dbo.quiz_notice ORDER BY created_at DESC',
    []
  );
  return NextResponse.json({ notices: rows });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { title, content, is_active } = await req.json();
  if (!title || !content) return NextResponse.json({ error: '제목과 내용은 필수입니다' }, { status: 400 });

  const { rows } = await db.query(
    `INSERT INTO dbo.quiz_notice (title, content, is_active) OUTPUT INSERTED.notice_id VALUES (@p1, @p2, @p3)`,
    [title, content, is_active ? 1 : 0]
  );
  return NextResponse.json({ ok: true, notice_id: rows[0]?.notice_id });
}
