import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  if (!session) redirect('/');

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem', overflowX: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
