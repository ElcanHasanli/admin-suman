'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.role !== 'admin') {
      logout();
      router.replace('/login');
    }
  }, [isAuthenticated, user, logout, router]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">Yüklənir...</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <DashboardShell onLogout={handleLogout}>
      {children}
    </DashboardShell>
  );
}

function DashboardShell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar onLogout={onLogout} />
      <main className="ml-[260px] min-h-screen p-8">{children}</main>
    </div>
  );
}
