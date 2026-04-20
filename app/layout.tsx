import type { Metadata } from 'next';
import './globals.css';
import { getSession } from '@/lib/auth';
import { checkIsAdmin } from '@/lib/admin';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: '가톨릭 퀴즈',
  description: '가톨릭 신앙 퀴즈 게임',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession().catch(() => null);
  const isAdmin = session ? await checkIsAdmin(session.username).catch(() => false) : false;

  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg)' }}>
        <NavBar session={session} isAdmin={isAdmin} />
        <main className="flex-1 relative z-10">{children}</main>
      </body>
    </html>
  );
}
