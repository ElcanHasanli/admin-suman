'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { initPushNotifications } from '@/lib/push';

/** Yalnız native APK/iOS-da push token qeydiyyatı və bildiriş klikləri */
export function PushNotificationsSetup() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    void initPushNotifications((path) => {
      router.push(path);
    });
  }, [isAuthenticated, user?.role, router]);

  return null;
}
