'use client';

import { useCallback, useEffect, useState } from 'react';
import { getNotifications } from '@/lib/api';
import {
  isNotificationRead,
  NOTIFICATIONS_REFRESH_EVENT,
} from '@/lib/notifications';

export function useNotificationUnread() {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const list = await getNotifications();
      setUnread(list.filter((n) => !isNotificationRead(n)).length);
    } catch {
      setUnread(0);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onRefresh = () => void refresh();
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
  }, [refresh]);

  return { unread, refresh };
}
