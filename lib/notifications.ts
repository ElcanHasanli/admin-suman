import type { AdminNotification, NotificationType } from '@/lib/types';
import type { PushScreen } from '@/lib/push';
import { getPathForPushScreen } from '@/lib/push';

export function isNotificationRead(n: AdminNotification): boolean {
  if (n.read === true || n.is_read === true) return true;
  if (n.read_at) return true;
  return false;
}

export function getNotificationCustomerId(n: AdminNotification): number | null {
  if (n.customer_id != null) return Number(n.customer_id);
  const raw = n.data?.customer_id;
  if (raw != null && raw !== '') return Number(raw);
  return null;
}

export function getNotificationLastOrderDate(n: AdminNotification): string | undefined {
  return n.last_order_date ?? n.data?.last_order_date;
}

export function getNotificationTargetPath(n: AdminNotification): string {
  const type = (n.type || n.data?.type || '').toLowerCase();

  if (type === 'customer_inactive') {
    const cid = getNotificationCustomerId(n);
    if (cid != null && !Number.isNaN(cid)) {
      return `/dashboard/customers/detail/?id=${cid}`;
    }
    return '/dashboard/customers/inactive';
  }

  const screen = (n.screen || n.data?.screen || '').toLowerCase() as PushScreen;
  if (
    screen === 'orders' ||
    screen === 'history' ||
    screen === 'customers' ||
    screen === 'warehouse'
  ) {
    return getPathForPushScreen(screen);
  }

  if (type === 'order_completed' || type === 'order_note') {
    return '/dashboard/orders';
  }
  if (type === 'expense_created') return '/dashboard/history';
  if (type === 'warehouse_updated') return '/dashboard/warehouse';

  return '/dashboard/notifications';
}

export function getNotificationTypeLabel(type: string): string {
  switch (type) {
    case 'customer_inactive':
      return 'Passiv müştəri';
    case 'order_completed':
      return 'Sifariş tamamlandı';
    case 'expense_created':
      return 'Yeni xərc';
    case 'order_note':
      return 'Sifariş qeydi';
    case 'warehouse_updated':
      return 'Anbar yeniləndi';
    default:
      return type || 'Bildiriş';
  }
}

export const INACTIVE_CUSTOMER_TYPE: NotificationType = 'customer_inactive';

export const NOTIFICATIONS_REFRESH_EVENT = 'suman-notifications-refresh';

export function dispatchNotificationsRefresh(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
  }
}
