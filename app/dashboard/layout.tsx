'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PushNotificationsSetup } from '@/components/notifications/PushNotificationsSetup';
import { unregisterPushNotifications } from '@/lib/push';

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
    void unregisterPushNotifications();
    logout();
    router.push('/login');
  };

  return (
    <DashboardShell onLogout={handleLogout}>
      <PushNotificationsSetup />
      {children}
    </DashboardShell>
  );
}
