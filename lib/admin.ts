import { getSession } from './auth';
import db from './db';

export type AdminRole = 'super' | 'sub';

function getSuperAdmin() {
  return process.env.SUPER_ADMIN || 'goodnews:679435';
}

export async function getAdminRole(username: string): Promise<AdminRole | null> {
  if (username === getSuperAdmin()) return 'super';
  try {
    const { rows } = await db.query(
      'SELECT 1 FROM dbo.quiz_admin WHERE username = @p1', [username]
    );
    return rows.length > 0 ? 'sub' : null;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getSession().catch(() => null);
  if (!session) return null;
  const role = await getAdminRole(session.username);
  if (!role) return null;
  return { ...session, role };
}

export async function requireSuperAdmin() {
  const result = await requireAdmin();
  if (!result || result.role !== 'super') return null;
  return result;
}

export async function checkIsAdmin(username: string): Promise<boolean> {
  return (await getAdminRole(username)) !== null;
}
