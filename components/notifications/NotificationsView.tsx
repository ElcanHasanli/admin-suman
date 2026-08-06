'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, RefreshCw, UserX, ChevronRight } from 'lucide-react';
import { getNotifications } from '@/lib/api';
import type { AdminNotification } from '@/lib/types';
import {
  dispatchNotificationsRefresh,
  getNotificationCustomerId,
  getNotificationLastOrderDate,
  getNotificationTargetPath,
  getNotificationTypeLabel,
  INACTIVE_CUSTOMER_TYPE,
  isNotificationRead,
} from '@/lib/notifications';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Toast, ToastType } from '@/components/ui/Toast';

type FilterMode = 'inactive' | 'all';

export function NotificationsView() {
  const router = useRouter();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('inactive');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getNotifications();
      setItems(data);
      dispatchNotificationsRefresh();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Bildirişlər yüklənə bilmədi',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((n) => (n.type || '').toLowerCase() === INACTIVE_CUSTOMER_TYPE);
  }, [items, filter]);

  const inactiveCount = useMemo(
    () => items.filter((n) => (n.type || '').toLowerCase() === INACTIVE_CUSTOMER_TYPE).length,
    [items]
  );

  const unreadCount = useMemo(() => items.filter((n) => !isNotificationRead(n)).length, [items]);

  const openNotification = (n: AdminNotification) => {
    router.push(getNotificationTargetPath(n));
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">Problemli müştəri siyahısı</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Son 30 gün sifariş yoxdur və qalıq bidon &gt; 0
          </p>
        </div>
        <Link
          href="/dashboard/customers/inactive"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-100 px-3 py-2.5 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 transition hover:bg-amber-200/70"
        >
          <UserX size={16} />
          Tam siyahı
        </Link>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('inactive')}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            filter === 'inactive'
              ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-200'
              : 'bg-white text-slate-600 ring-1 ring-slate-200'
          }`}
        >
          30+ gün passiv ({inactiveCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-sky-600 text-white'
              : 'bg-white text-slate-600 ring-1 ring-slate-200'
          }`}
        >
          Hamısı ({items.length})
        </button>
        {unreadCount > 0 && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
            {unreadCount} oxunmamış
          </span>
        )}
        <Button
          type="button"
          variant="secondary"
          className="ml-auto"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Yenilə
        </Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-500">Yüklənir...</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 font-medium text-slate-700">Bildiriş yoxdur</p>
          <p className="mt-1 text-sm text-slate-500">
            {filter === 'inactive'
              ? '30 gündən çox sifariş verməyən müştəri tapılmadı'
              : 'Hələ heç bir bildiriş yoxdur'}
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => (
            <NotificationRow key={n.id} item={n} onOpen={() => openNotification(n)} />
          ))}
        </ul>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: AdminNotification;
  onOpen: () => void;
}) {
  const read = isNotificationRead(item);
  const isInactive = (item.type || '').toLowerCase() === INACTIVE_CUSTOMER_TYPE;
  const lastOrder = getNotificationLastOrderDate(item);
  const customerId = getNotificationCustomerId(item);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:ring-2 hover:ring-sky-200 ${
          read
            ? 'border-slate-200 bg-white'
            : 'border-sky-200 bg-sky-50/50'
        } ${isInactive ? 'border-l-4 border-l-amber-400' : ''}`}
      >
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isInactive ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isInactive ? <UserX size={20} /> : <Bell size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {getNotificationTypeLabel(String(item.type))}
            </span>
            {!read && (
              <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                Yeni
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-900">{item.message}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(item.created_at)}
            {lastOrder ? ` · Son sifariş: ${lastOrder}` : ''}
            {customerId != null ? ` · ID: ${customerId}` : ''}
          </p>
        </div>
        <ChevronRight className="mt-2 shrink-0 text-slate-400" size={20} />
      </button>
    </li>
  );
}
