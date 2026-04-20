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
    `SELECT u.user_id, u.username, u.nickname, u.name, u.christen,
            u.chukmonth, u.chukday, u.email, u.phone_number,
            u.parish, u.church, u.gyogu_code, u.bon_cd
     FROM dbo.quiz_session s JOIN dbo.quiz_user u ON u.user_id = s.user_id
     WHERE s.session_id = @p1 AND s.expires_at > GETDATE()`,
    [sessionId]
  );
  const user = rows[0];
  if (!user) return null;
  try {
    const { rows: bRows } = await db.query(
      'SELECT is_blocked FROM dbo.quiz_user WHERE user_id = @p1', [user.user_id]
    );
    if (bRows[0]?.is_blocked) return null;
  } catch {
    // is_blocked 컬럼 없음 (admin_schema_v2.sql 미적용) - 무시
  }
  return user;
}

export async function deleteSession(sessionId: string) {
  await db.query('DELETE FROM dbo.quiz_session WHERE session_id = @p1', [sessionId]);
}
