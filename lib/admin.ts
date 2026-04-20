import { getSession } from './auth';
import db from './db';
export { ALL_MENUS } from './permissions';
export type { MenuKey } from './permissions';

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

// null = 전체 허용 (슈퍼관리자 or permissions 컬럼 NULL)
export async function getAdminPermissions(username: string): Promise<MenuKey[] | null> {
  if (username === getSuperAdmin()) return null;
  try {
    const { rows } = await db.query(
      'SELECT permissions FROM dbo.quiz_admin WHERE username = @p1', [username]
    );
    if (!rows[0]) return null;
    const raw = rows[0].permissions;
    if (!raw) return null;
    return raw.split(',').map((p: string) => p.trim()).filter(Boolean) as MenuKey[];
  } catch {
    return null;
  }
}

export function hasPermission(permissions: MenuKey[] | null, key: MenuKey): boolean {
  if (permissions === null) return true;
  return permissions.includes(key);
}

export async function requireAdmin() {
  const session = await getSession().catch(() => null);
  if (!session) return null;
  const role = await getAdminRole(session.username);
  if (!role) return null;
  return { ...session, role };
}

export async function requireAdminWithPerms() {
  const session = await getSession().catch(() => null);
  if (!session) return null;
  const role = await getAdminRole(session.username);
  if (!role) return null;
  const permissions = role === 'super' ? null : await getAdminPermissions(session.username);
  return { ...session, role, permissions };
}

export async function requireSuperAdmin() {
  const result = await requireAdmin();
  if (!result || result.role !== 'super') return null;
  return result;
}

export async function checkIsAdmin(username: string): Promise<boolean> {
  return (await getAdminRole(username)) !== null;
}
