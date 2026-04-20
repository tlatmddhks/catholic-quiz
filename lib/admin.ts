import { getSession } from './auth';

export async function requireAdmin() {
  const session = await getSession().catch(() => null);
  const admins = (process.env.ADMIN_USERNAMES || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!session || !admins.includes(session.username)) return null;
  return session;
}
