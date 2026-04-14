import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

const TOKEN_URL = 'https://auth.catholic.or.kr/oauth/token';
const USERINFO_URL = 'https://auth.catholic.or.kr/oauth/userinfo';

function redirect(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.url));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code || !state) {
    return redirect(req, '/login?error=oauth');
  }

  const cookieState = req.cookies.get('oauth_state')?.value;
  const codeVerifier = req.cookies.get('oauth_verifier')?.value;

  if (state !== cookieState || !codeVerifier) {
    return redirect(req, '/login?error=invalid');
  }

  // 토큰 교환 (token_endpoint_auth_method: 'none' → client_secret 미포함)
  const base = process.env.APP_URL!;
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${base}/api/auth/callback`,
      client_id: process.env.GOODNEWS_CLIENT_ID!,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    console.error('Token exchange failed:', await tokenRes.text());
    return redirect(req, '/login?error=token');
  }

  const { access_token } = await tokenRes.json();

  // 사용자 정보 조회
  const userInfoRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userInfoRes.ok) {
    console.error('Userinfo failed:', await userInfoRes.text());
    return redirect(req, '/login?error=userinfo');
  }

  const userInfo = await userInfoRes.json();
  const sub: string = userInfo.sub;
  const nickname: string = userInfo.name || userInfo.nickname || userInfo.preferred_username || sub;
  const username = `goodnews:${sub}`;

  // 사용자 upsert
  const { rows: existing } = await db.query(
    'SELECT user_id FROM quiz_user WHERE username = @p1',
    [username]
  );

  let userId: number;
  if (existing.length > 0) {
    userId = existing[0].user_id;
    await db.query('UPDATE quiz_user SET nickname = @p1 WHERE user_id = @p2', [nickname, userId]);
  } else {
    const { rows: maxRows } = await db.query('SELECT ISNULL(MAX(user_id),0)+1 AS next_id FROM quiz_user');
    userId = maxRows[0].next_id;
    await db.query(
      'INSERT INTO quiz_user (user_id, username, password_hash, nickname, created_at) VALUES (@p1,@p2,@p3,@p4,GETDATE())',
      [userId, username, 'GOODNEWS_OAUTH', nickname]
    );
  }

  // 세션 생성
  const sessionId = await createSession(userId);
  const res = redirect(req, '/');
  res.cookies.set('qsession', sessionId, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
  res.cookies.delete('oauth_state');
  res.cookies.delete('oauth_verifier');
  return res;
}
