import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { username } = await params;
  try {
    await db.query('DELETE FROM dbo.quiz_admin WHERE username = @p1', [decodeURIComponent(username)]);
  } catch { /* 테이블 없으면 무시 */ }
  return NextResponse.json({ ok: true });
}
