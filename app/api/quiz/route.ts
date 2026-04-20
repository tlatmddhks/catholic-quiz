import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'random';
  const lv = searchParams.get('lv');
  const count = Math.min(parseInt(searchParams.get('count') || '10'), 30);

  const conditions: string[] = [];
  const params: any[] = [];

  if (mode === 'test') {
    conditions.push('is_test = @p' + (params.length + 1)); params.push('Y');
  } else {
    if (mode === 'ox') {
      conditions.push('ox = @p' + (params.length + 1)); params.push('Y');
    } else if (mode === 'chosung') {
      conditions.push('shuffle = @p' + (params.length + 1)); params.push('Y');
    } else if (mode === 'normal') {
      conditions.push('normal = @p' + (params.length + 1)); params.push('Y');
    } else if (mode === 'survival') {
      conditions.push('survival_yn = @p' + (params.length + 1)); params.push('Y');
    }
    // is_visible 필터 추가
    conditions.push('is_visible = @p' + (params.length + 1)); params.push('Y');
  }

  if (lv) {
    conditions.push('lv = @p' + (params.length + 1));
    params.push(parseInt(lv));
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = `
    SELECT TOP ${count} id, area, lv, pt, type, question, right_word, wrong_word, explain_word
    FROM dbo.quiz ${where} ORDER BY NEWID()
  `;

  // is_visible/is_test 컬럼 없을 경우 폴백
  const sqlFallback = (() => {
    const fbConds = conditions.filter((_, i) => {
      const p = params[i];
      return p !== 'Y' || conditions[i].indexOf('is_visible') === -1 && conditions[i].indexOf('is_test') === -1;
    });
    const fbParams = params.filter((p, i) => {
      return !(conditions[i]?.includes('is_visible') || conditions[i]?.includes('is_test'));
    });
    const fbWhere = fbConds.length ? 'WHERE ' + fbConds.join(' AND ') : '';
    return { sql: `SELECT TOP ${count} id, area, lv, pt, type, question, right_word, wrong_word, explain_word FROM dbo.quiz ${fbWhere} ORDER BY NEWID()`, params: fbParams };
  })();

  try {
    let rows: any[];
    try {
      ({ rows } = await db.query(sql, params));
    } catch {
      ({ rows } = await db.query(sqlFallback.sql, sqlFallback.params));
    }

    const questions = rows.map((q: any) => {
      const wrongList = q.wrong_word
        ? q.wrong_word.split('/').map((w: string) => w.trim()).filter(Boolean)
        : [];
      return {
        id: q.id, area: q.area, lv: q.lv, pt: q.pt, type: q.type,
        question: q.question, right_word: q.right_word,
        wrong_words: wrongList, explain_word: q.explain_word,
      };
    });

    return NextResponse.json({ questions });
  } catch (e: any) {
    console.error('[quiz GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
