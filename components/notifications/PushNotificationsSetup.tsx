'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { initPushNotifications, isNativeApp } from '@/lib/push';
import { Toast, ToastType } from '@/components/ui/Toast';

export function PushNotificationsSetup() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    void initPushNotifications((path) => {
      router.push(path);
    })
      .then((result) => {
        if (!isNativeApp()) return;

        if (result.ok) {
          setToast({
            message: `Push aktiv (${result.platform}) — token serverə göndərildi`,
            type: 'success',
          });
        } else {
          setToast({
            message: result.reason,
            type: 'error',
          });
        }
      })
      .catch((err) => {
        if (!isNativeApp()) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Push qeydiyyatı uğursuz';
        setToast({ message: msg, type: 'error' });
      });
  }, [isAuthenticated, user?.role, router]);

  if (!toast) return null;

  return (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  );
}
