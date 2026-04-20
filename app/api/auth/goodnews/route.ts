import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

const AUTH_URL = 'https://auth.catholic.or.kr/oauth/auth';

export async function GET() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');

  const redirectUri = `${process.env.APP_URL}/api/auth/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.GOODNEWS_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'openid profile catholic',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'login',
  });

  const res = NextResponse.redirect(`${AUTH_URL}?${params}`);
  res.cookies.set('oauth_verifier', codeVerifier, { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax' });
  res.cookies.set('oauth_state', state, { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax' });
  return res;
}
