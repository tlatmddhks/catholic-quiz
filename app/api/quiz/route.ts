import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'nodejs';

function buildConditions(mode: string, lv: string | null, withVisibility: boolean) {
  const conditions: string[] = [];
  const params: any[] = [];

  if (mode === 'test') {
    conditions.push('is_test = @p' + (params.length + 1)); params.push('Y');
  } else {
    if (mode === 'ox')       { conditions.push('ox = @p'         + (params.length + 1)); params.push('Y'); }
    else if (mode === 'chosung') { conditions.push('shuffle = @p' + (params.length + 1)); params.push('Y'); }
    else if (mode === 'normal')  { conditions.push('normal = @p'  + (params.length + 1)); params.push('Y'); }
    else if (mode === 'survival'){ conditions.push('survival_yn = @p' + (params.length + 1)); params.push('Y'); }
    if (withVisibility) {
      conditions.push('is_visible = @p' + (params.length + 1)); params.push('Y');
    }
  }

  if (lv) { conditions.push('lv = @p' + (params.length + 1)); params.push(parseInt(lv)); }

  return { conditions, params };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'random';
  const lv = searchParams.get('lv');
  const count = Math.min(parseInt(searchParams.get('count') || '10'), 30);

  const cols = 'id, area, lv, pt, type, question, right_word, wrong_word, explain_word';

  async function runQuery(withVisibility: boolean) {
    const { conditions, params } = buildConditions(mode, lv, withVisibility);
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT TOP ${count} ${cols} FROM dbo.quiz ${where} ORDER BY NEWID()`;
    return db.query(sql, params);
  }

  try {
    let rows: any[];
    try {
      ({ rows } = await runQuery(true));
    } catch {
      ({ rows } = await runQuery(false));
    }

    const questions = rows.map((q: any) => ({
      id: q.id, area: q.area, lv: q.lv, pt: q.pt, type: q.type,
      question: q.question, right_word: q.right_word,
      wrong_words: q.wrong_word ? q.wrong_word.split('/').map((w: string) => w.trim()).filter(Boolean) : [],
      explain_word: q.explain_word,
    }));

    return NextResponse.json({ questions });
  } catch (e: any) {
    console.error('[quiz GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
