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

  if (mode === 'ox') {
    conditions.push('ox = @p' + (params.length + 1)); params.push('Y');
  } else if (mode === 'chosung') {
    conditions.push('shuffle = @p' + (params.length + 1)); params.push('Y');
    conditions.push('type = @p' + (params.length + 1)); params.push(3);
  } else if (mode === 'survival') {
    conditions.push('survival_yn = @p' + (params.length + 1)); params.push('Y');
  } else {
    conditions.push('(normal = @p' + (params.length + 1) + ' OR ox = @p' + (params.length + 2) + ')');
    params.push('Y', 'Y');
  }

  if (lv) {
    conditions.push('lv = @p' + (params.length + 1));
    params.push(parseInt(lv));
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  // MSSQL 랜덤 추출
  const sql = `
    SELECT TOP ${count} id, area, lv, pt, type, question, right_word, wrong_word, explain_word
    FROM dbo.quiz
    ${where}
    ORDER BY NEWID()
  `;

  try {
    const { rows } = await db.query(sql, params);

    // 초성 퀴즈: wrong_word를 '/' 분리해서 보기 목록으로
    const questions = rows.map((q: any) => {
      const wrongList = q.wrong_word
        ? q.wrong_word.split('/').map((w: string) => w.trim()).filter(Boolean)
        : [];
      return {
        id: q.id,
        area: q.area,
        lv: q.lv,
        pt: q.pt,
        type: q.type,
        question: q.question,
        right_word: q.right_word,
        wrong_words: wrongList,
        explain_word: q.explain_word,
      };
    });

    return NextResponse.json({ questions });
  } catch (e: any) {
    console.error('[quiz GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
