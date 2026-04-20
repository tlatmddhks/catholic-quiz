import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { rows } = await db.query('SELECT * FROM dbo.quiz_notice WHERE notice_id = @p1', [parseInt(id)]);
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ notice: rows[0] });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { title, content, is_active } = await req.json();
  await db.query(
    'UPDATE dbo.quiz_notice SET title=@p1, content=@p2, is_active=@p3, updated_at=GETDATE() WHERE notice_id=@p4',
    [title, content, is_active ? 1 : 0, parseInt(id)]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await db.query('DELETE FROM dbo.quiz_notice WHERE notice_id = @p1', [parseInt(id)]);
  return NextResponse.json({ ok: true });
}
