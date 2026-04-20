import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let rows: any[] = [];
    try {
      ({ rows } = await db.query(`
        SELECT a.username, a.added_by, a.created_at,
               ISNULL(a.permissions, NULL) AS permissions,
               u.name, u.nickname
        FROM dbo.quiz_admin a
        LEFT JOIN dbo.quiz_user u ON u.username = a.username
        ORDER BY a.created_at DESC
      `, []));
    } catch {
      try {
        ({ rows } = await db.query(`
          SELECT username, added_by, created_at,
                 NULL AS permissions, NULL AS name, NULL AS nickname
          FROM dbo.quiz_admin
          ORDER BY created_at DESC
        `, []));
      } catch {
        rows = [];
      }
    }

    return NextResponse.json({ admins: rows });
  } catch (e: any) {
    console.error('[admins GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { username } = body;
    if (!username) return NextResponse.json({ error: 'username 필수' }, { status: 400 });

    if (username === (process.env.SUPER_ADMIN || 'goodnews:679435')) {
      return NextResponse.json({ error: '슈퍼 관리자는 변경할 수 없습니다' }, { status: 400 });
    }

    // quiz_user 존재 확인 (실패해도 진행)
    try {
      const { rows: existing } = await db.query(
        'SELECT 1 FROM dbo.quiz_user WHERE username = @p1', [username]
      );
      if (!existing.length) {
        return NextResponse.json({ error: '존재하지 않는 회원입니다' }, { status: 404 });
      }
    } catch {
      // quiz_user 조회 실패 시 존재 확인 건너뜀
    }

    await db.query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.quiz_admin WHERE username=@p1)
       INSERT INTO dbo.quiz_admin (username, added_by) VALUES (@p1, @p2)`,
      [username, admin.username]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[admins POST]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
