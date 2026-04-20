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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { username } = await params;
    const { permissions } = await req.json();
    // permissions: string[] | null (null = 전체 허용)
    const permStr = Array.isArray(permissions) ? permissions.join(',') : null;
    await db.query(
      'UPDATE dbo.quiz_admin SET permissions = @p1 WHERE username = @p2',
      [permStr, decodeURIComponent(username)]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[admins PATCH]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
