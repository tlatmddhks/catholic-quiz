import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const type = searchParams.get('type') || '';
  const lv = searchParams.get('lv') || '';
  const q = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || '';
  const sortDir = searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC';
  const limit = 20;
  const offset = (page - 1) * limit;

  const orderBy = sortBy === 'lv'
    ? `lv ${sortDir}`
    : sortBy === 'survival'
    ? `survival_yn ${sortDir}, id DESC`
    : sortBy === 'type'
    ? `CASE WHEN shuffle='Y' THEN 1 WHEN ox='Y' THEN 2 ELSE 3 END ${sortDir}`
    : 'id DESC';

  const conditions: string[] = [];
  const params: any[] = [];

  if (type === 'ox')      { conditions.push('ox = @p' + (params.length+1)); params.push('Y'); }
  if (type === 'chosung') { conditions.push('shuffle = @p' + (params.length+1)); params.push('Y'); }
  if (type === 'normal')  { conditions.push('normal = @p' + (params.length+1)); params.push('Y'); }
  if (type === 'image')   { conditions.push('image_url IS NOT NULL'); }
  if (type === 'test')    { conditions.push('is_test = @p' + (params.length+1)); params.push('Y'); }
  if (lv)                 { conditions.push('lv = @p' + (params.length+1)); params.push(parseInt(lv)); }
  if (q)                  { conditions.push('question LIKE @p' + (params.length+1)); params.push(`%${q}%`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  let listResult: any, countResult: any;
  try {
    [listResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, area, lv, pt, type, question, right_word, wrong_word, explain_word, ox, shuffle, survival_yn, normal,
                ISNULL(is_visible,'Y') AS is_visible, ISNULL(is_test,'N') AS is_test, image_url
         FROM dbo.quiz ${where}
         ORDER BY ${orderBy}
         OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`,
        params
      ),
      db.query(`SELECT CAST(COUNT(*) AS INT) AS total FROM dbo.quiz ${where}`, params),
    ]);
  } catch {
    [listResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, area, lv, pt, type, question, right_word, wrong_word, explain_word, ox, shuffle, survival_yn, normal,
                'Y' AS is_visible, 'N' AS is_test, NULL AS image_url
         FROM dbo.quiz ${where}
         ORDER BY ${orderBy}
         OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`,
        params
      ),
      db.query(`SELECT CAST(COUNT(*) AS INT) AS total FROM dbo.quiz ${where}`, params),
    ]);
  }

  return NextResponse.json({ quizzes: listResult.rows, total: countResult.rows[0]?.total ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { rows: maxRows } = await db.query('SELECT ISNULL(MAX(id),0)+1 AS next_id FROM dbo.quiz');
    const newId = maxRows[0].next_id;

    try {
      await db.query(
        `INSERT INTO dbo.quiz (id, area, lv, pt, type, question, right_word, wrong_word, explain_word, ox, shuffle, survival_yn, normal, is_visible, is_test, image_url)
         VALUES (@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8,@p9,@p10,@p11,@p12,@p13,@p14,@p15,@p16)`,
        [
          newId,
          parseInt(body.area) || 0, body.lv || 1, body.pt || 50, body.type || 1,
          body.question, body.right_word, body.wrong_word || null, body.explain_word || null,
          body.ox || 'N', body.shuffle || 'N', body.survival_yn || 'N', body.normal || 'N',
          body.is_visible || 'Y', body.is_test || 'N', body.image_url || null,
        ]
      );
    } catch {
      await db.query(
        `INSERT INTO dbo.quiz (id, area, lv, pt, type, question, right_word, wrong_word, explain_word, ox, shuffle, survival_yn, normal)
         VALUES (@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8,@p9,@p10,@p11,@p12,@p13)`,
        [
          newId,
          parseInt(body.area) || 0, body.lv || 1, body.pt || 50, body.type || 1,
          body.question, body.right_word, body.wrong_word || null, body.explain_word || null,
          body.ox || 'N', body.shuffle || 'N', body.survival_yn || 'N', body.normal || 'N',
        ]
      );
    }

    return NextResponse.json({ ok: true, id: newId });
  } catch (e: any) {
    console.error('[quiz POST]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
