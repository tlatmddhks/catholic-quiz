import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/admin';
import AdminsClient from './AdminsClient';

export default async function AdminsPage() {
  const admin = await requireSuperAdmin();
  if (!admin) redirect('/admin');

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>관리자 관리</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        서브 관리자를 추가하거나 제거합니다. 서브 관리자는 모든 관리 기능을 사용할 수 있습니다.
      </p>
      <AdminsClient />
    </div>
  );
}
