import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

async function ensureTable() {
  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='quiz_admin' AND schema_id=SCHEMA_ID('dbo'))
    CREATE TABLE dbo.quiz_admin (
      username    NVARCHAR(100) NOT NULL PRIMARY KEY,
      added_by    NVARCHAR(100) NOT NULL,
      created_at  DATETIME2     NOT NULL DEFAULT GETDATE()
    )
  `, []);
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureTable();

  const { rows } = await db.query(`
    SELECT a.username, a.added_by, a.created_at,
           u.name, u.nickname
    FROM dbo.quiz_admin a
    LEFT JOIN dbo.quiz_user u ON u.username = a.username
    ORDER BY a.created_at DESC
  `, []);

  return NextResponse.json({ admins: rows });
}

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: 'username 필수' }, { status: 400 });

  if (username === (process.env.SUPER_ADMIN || 'goodnews:679435')) {
    return NextResponse.json({ error: '슈퍼 관리자는 변경할 수 없습니다' }, { status: 400 });
  }

  const { rows: existing } = await db.query(
    'SELECT 1 FROM dbo.quiz_user WHERE username = @p1', [username]
  );
  if (!existing.length) {
    return NextResponse.json({ error: '존재하지 않는 회원입니다' }, { status: 404 });
  }

  await ensureTable();

  await db.query(
    `IF NOT EXISTS (SELECT 1 FROM dbo.quiz_admin WHERE username=@p1)
     INSERT INTO dbo.quiz_admin (username, added_by) VALUES (@p1, @p2)`,
    [username, admin.username]
  );

  return NextResponse.json({ ok: true });
}
