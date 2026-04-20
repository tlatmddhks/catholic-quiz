import { cookies } from 'next/headers';
import db from './db';
import crypto from 'crypto';

export function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.query(
    'INSERT INTO dbo.quiz_session (session_id, user_id, expires_at) VALUES (@p1, @p2, @p3)',
    [sessionId, userId, expiresAt]
  );
  return sessionId;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('qsession')?.value;
  if (!sessionId) return null;
  const { rows } = await db.query(
    `SELECT u.user_id, u.username, u.nickname
     FROM dbo.quiz_session s JOIN dbo.quiz_user u ON u.user_id = s.user_id
     WHERE s.session_id = @p1 AND s.expires_at > GETDATE()`,
    [sessionId]
  );
  return rows[0] || null;
}

export async function deleteSession(sessionId: string) {
  await db.query('DELETE FROM dbo.quiz_session WHERE session_id = @p1', [sessionId]);
}
