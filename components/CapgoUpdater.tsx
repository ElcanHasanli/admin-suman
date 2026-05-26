'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

/**
 * Capgo OTA: native app hazır olduqda çağırılmalıdır.
 * Uğursuz çağırışda əvvəlki bundle-a rollback ola bilər.
 */
export function CapgoUpdater() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void CapacitorUpdater.notifyAppReady().catch((err) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Capgo] notifyAppReady:', err);
      }
    });
  }, []);

  return null;
}
