'use client';

import { useNotificationUnread } from '@/components/notifications/useNotificationUnread';

export function NotificationNavBadge() {
  const { unread } = useNotificationUnread();
  if (unread <= 0) return null;

  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
      {unread > 99 ? '99+' : unread}
    </span>
  );
}
