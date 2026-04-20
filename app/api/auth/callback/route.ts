import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

const TOKEN_URL = 'https://auth.catholic.or.kr/oauth/token';
const USERINFO_URL = 'https://auth.catholic.or.kr/oauth/me';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const base = process.env.APP_URL!;

  if (error || !code || !state) {
    return NextResponse.redirect(`${base}/login?error=oauth`);
  }

  const cookieState = req.cookies.get('oauth_state')?.value;
  const codeVerifier = req.cookies.get('oauth_verifier')?.value;

  if (state !== cookieState || !codeVerifier) {
    console.error('[auth/callback] state mismatch or missing verifier', { state, cookieState, hasVerifier: !!codeVerifier });
    return NextResponse.redirect(`${base}/login?error=invalid`);
  }

  // 토큰 교환 (token_endpoint_auth_method: 'none' → client_secret 미포함)
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
    return NextResponse.redirect(`${base}/login?error=token`);
  }

  const { access_token } = await tokenRes.json();

  // 사용자 정보 조회 (/oauth/me)
  const userInfoRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userInfoRes.ok) {
    console.error('Userinfo failed:', await userInfoRes.text());
    return NextResponse.redirect(`${base}/login?error=userinfo`);
  }
  const u = await userInfoRes.json();
  const sub: string = u.sub;
  const username = `goodnews:${sub}`;
  const nickname: string = u.name || sub;

  // 사용자 upsert
  const { rows: existing } = await db.query(
    'SELECT user_id FROM dbo.quiz_user WHERE username = @p1',
    [username]
  );

  let userId: number;
  if (existing.length > 0) {
    userId = existing[0].user_id;
    await db.query(
      `UPDATE dbo.quiz_user SET
         nickname=@p1, name=@p2, christen=@p3, chukmonth=@p4, chukday=@p5,
         email=@p6, phone_number=@p7, parish=@p8, church=@p9, gyogu_code=@p10, bon_cd=@p11
       WHERE user_id=@p12`,
      [nickname, u.name||null, u.christen||null, u.chukmonth||null, u.chukday||null,
       u.email||null, u.phone_number||null, u.parish||null, u.church||null, u.gyogu_code||null, u.bon_cd||null,
       userId]
    );
  } else {
    const { rows: maxRows } = await db.query('SELECT ISNULL(MAX(user_id),0)+1 AS next_id FROM dbo.quiz_user');
    userId = maxRows[0].next_id;
    await db.query(
      `INSERT INTO dbo.quiz_user
         (user_id, username, password_hash, nickname, name, christen, chukmonth, chukday,
          email, phone_number, parish, church, gyogu_code, bon_cd, created_at)
       VALUES (@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8,@p9,@p10,@p11,@p12,@p13,@p14,GETDATE())`,
      [userId, username, 'GOODNEWS_OAUTH', nickname, u.name||null, u.christen||null,
       u.chukmonth||null, u.chukday||null, u.email||null, u.phone_number||null,
       u.parish||null, u.church||null, u.gyogu_code||null, u.bon_cd||null]
    );
  }

  // 세션 생성
  const sessionId = await createSession(userId);
  const res = NextResponse.redirect(base);
  res.cookies.set('qsession', sessionId, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/', sameSite: 'lax' });
  res.cookies.delete('oauth_state');
  res.cookies.delete('oauth_verifier');
  return res;
}
