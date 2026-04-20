import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const text = await req.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return NextResponse.json({ error: '데이터가 없습니다' }, { status: 400 });

  // header: type,area,lv,pt,question,right_word,wrong_word,explain_word,survival_yn
  const rows = lines.slice(1);
  let inserted = 0;
  let errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const cols = parseCSVLine(rows[i]);
    if (cols.length < 6) { errors.push(`${i + 2}행: 컬럼 부족`); continue; }

    const [type, area, lvStr, ptStr, question, right_word, wrong_word, explain_word, survival_yn] = cols;
    if (!question || !right_word) { errors.push(`${i + 2}행: 문제/정답 필수`); continue; }

    const lv = parseInt(lvStr) || 1;
    const pt = parseInt(ptStr) || 10;
    const isOx = type === 'ox';
    const isChosung = type === 'chosung';

    try {
      const { rows: maxRows } = await db.query('SELECT ISNULL(MAX(id),0)+1 AS next_id FROM dbo.quiz');
      const newId = maxRows[0].next_id;
      await db.query(
        `INSERT INTO dbo.quiz (id,area,lv,pt,type,question,right_word,wrong_word,explain_word,ox,shuffle,survival_yn,normal)
         VALUES (@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8,@p9,@p10,@p11,@p12,@p13)`,
        [
          newId, area || '', lv, pt, isChosung ? 3 : 1,
          question, right_word, wrong_word || null, explain_word || null,
          isOx ? 'Y' : 'N', isChosung ? 'Y' : 'N',
          survival_yn === 'Y' ? 'Y' : 'N',
          (!isOx && !isChosung) ? 'Y' : 'N',
        ]
      );
      inserted++;
    } catch (e: any) {
      errors.push(`${i + 2}행: ${e.message}`);
    }
  }

  return NextResponse.json({ inserted, errors, total: rows.length });
}
