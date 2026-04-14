import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('qsession')?.value;
  if (sessionId) await deleteSession(sessionId).catch(() => {});
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('qsession');
  return res;
}
