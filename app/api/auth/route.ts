import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

// 회원가입
export async function POST(req: NextRequest) {
  const { action, username, password, nickname } = await req.json();

  if (action === 'register') {
    if (!username || !password || !nickname) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
    }
    const { rows: exists } = await db.query(
      'SELECT user_id FROM quiz_user WHERE username = @p1', [username]
    );
    if (exists.length > 0) {
      return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const { rows: maxRows } = await db.query('SELECT ISNULL(MAX(user_id),0)+1 AS next_id FROM quiz_user');
    const userId = maxRows[0].next_id;
    await db.query(
      'INSERT INTO quiz_user (user_id, username, password_hash, nickname, created_at) VALUES (@p1,@p2,@p3,@p4,GETDATE())',
      [userId, username, hashed, nickname]
    );
    const sessionId = await createSession(userId);
    const res = NextResponse.json({ ok: true, nickname });
    res.cookies.set('qsession', sessionId, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
    return res;
  }

  if (action === 'login') {
    if (!username || !password) {
      return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 });
    }
    const { rows } = await db.query(
      'SELECT user_id, password_hash, nickname FROM quiz_user WHERE username = @p1', [username]
    );
    if (!rows[0]) return NextResponse.json({ error: '아이디 또는 비밀번호가 틀렸습니다.' }, { status: 401 });
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return NextResponse.json({ error: '아이디 또는 비밀번호가 틀렸습니다.' }, { status: 401 });

    const sessionId = await createSession(rows[0].user_id);
    const res = NextResponse.json({ ok: true, nickname: rows[0].nickname });
    res.cookies.set('qsession', sessionId, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
    return res;
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
