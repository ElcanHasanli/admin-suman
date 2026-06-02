'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { initPushNotifications } from '@/lib/push';

/** Push qeydiyyatı — iOS/Android-də toast göstərilmir (səssiz). */
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
