import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { rows } = await db.query('SELECT * FROM dbo.quiz WHERE id = @p1', [parseInt(id)]);
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ quiz: rows[0] });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  try {
    const body = await req.json();
    await db.query(
      `UPDATE dbo.quiz SET
         area=@p1, lv=@p2, pt=@p3, type=@p4, question=@p5,
         right_word=@p6, wrong_word=@p7, explain_word=@p8,
         ox=@p9, shuffle=@p10, survival_yn=@p11, normal=@p12
       WHERE id=@p13`,
      [
        parseInt(body.area) || 0, body.lv || 1, body.pt || 10, body.type || 1,
        body.question, body.right_word, body.wrong_word || null, body.explain_word || null,
        body.ox || 'N', body.shuffle || 'N', body.survival_yn || 'N', body.normal || 'N',
        parseInt(id),
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[quiz PUT]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { survival_yn } = await req.json();
  await db.query('UPDATE dbo.quiz SET survival_yn=@p1 WHERE id=@p2', [survival_yn, parseInt(id)]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await db.query('DELETE FROM dbo.quiz WHERE id = @p1', [parseInt(id)]);
  return NextResponse.json({ ok: true });
}
