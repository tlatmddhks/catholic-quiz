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
    else if (mode === 'image')   { conditions.push('image_url IS NOT NULL'); }
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

  const cols = 'id, area, lv, pt, type, question, right_word, wrong_word, explain_word, ox, shuffle, image_url';

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
      if (mode === 'test') {
        // is_test 컬럼 없음 → 빈 결과
        rows = [];
      } else {
        ({ rows } = await runQuery(false));
      }
    }

    let questions = rows.map((q: any) => ({
      id: q.id, area: q.area, lv: q.lv, pt: q.pt, type: q.type,
      question: q.question, right_word: q.right_word,
      wrong_words: q.wrong_word ? q.wrong_word.split('/').map((w: string) => w.trim()).filter(Boolean) : [],
      explain_word: q.explain_word,
      ox: q.ox, shuffle: q.shuffle, image_url: q.image_url || null,
    }));

    // 이미지 모드: 오답 보기가 부족한 문제에 랜덤 오답 보충
    if (mode === 'image' && questions.length > 0) {
      const allRightWords = new Set(questions.map((q: any) => q.right_word));
      const { rows: extras } = await db.query(
        `SELECT DISTINCT TOP 50 right_word FROM dbo.quiz WHERE image_url IS NULL AND right_word NOT IN (${
          Array.from(allRightWords).map((_,i) => `@p${i+1}`).join(',')
        }) ORDER BY NEWID()`,
        Array.from(allRightWords)
      ).catch(() => ({ rows: [] as any[] }));
      const pool = extras.map((r: any) => r.right_word).filter(Boolean);

      questions = questions.map((q: any) => {
        if (q.wrong_words.length >= 3) return q;
        const needed = 3 - q.wrong_words.length;
        const candidates = pool.filter((w: string) => w !== q.right_word && !q.wrong_words.includes(w));
        const picked = candidates.sort(() => Math.random() - 0.5).slice(0, needed);
        return { ...q, wrong_words: [...q.wrong_words, ...picked] };
      });
    }

    return NextResponse.json({ questions });
  } catch (e: any) {
    console.error('[quiz GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
