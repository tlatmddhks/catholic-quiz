import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { rows } = await db.query(
      'SELECT DISTINCT area FROM dbo.quiz WHERE area IS NOT NULL ORDER BY area',
      []
    );
    return NextResponse.json({ areas: rows.map((r: any) => r.area) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
