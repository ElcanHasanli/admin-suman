'use client';

import { useAppLayout } from '@/components/layout/useAppLayout';

/** Mobil APK / iOS / kiçik ekran */
export function MobileOnly({ children }: { children: React.ReactNode }) {
  const { bottomNav } = useAppLayout();
  if (!bottomNav) return null;
  return <>{children}</>;
}

/** Desktop sidebar rejimi */
export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const { bottomNav } = useAppLayout();
  if (bottomNav) return null;
  return <>{children}</>;
}
