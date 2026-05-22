'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  TrendingUp,
  CheckCircle,
  Banknote,
  CreditCard,
  CircleDollarSign,
  XCircle,
} from 'lucide-react';
import { exportHistoryExcel, getHistory, markOrderPaid } from '@/lib/api';
import type { DateRangePreset, HistorySummary, Order } from '@/lib/types';
import {
  downloadBlob,
  formatCurrency,
  getDateRange,
  getOrderBidonCount,
  getOrderCourierName,
  getOrderCustomerName,
  getOrderDate,
  getOrderStatusLabel,
  formatPaidAt,
  getOrderPaidLabel,
  getCreditRevenue,
  getOrderCreditRevenueAmount,
  getPaymentTypeLabel,
  getUnpaidCreditDebt,
  isOrderCreditPayment,
  isOrderPaid,
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, StatCard } from '@/components/ui/Card';
import { TableScroll } from '@/components/ui/TableScroll';
import { Badge, orderStatusVariant } from '@/components/ui/Badge';
import { Toast, ToastType } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

export function HistoryView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<DateRangePreset>('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const period = preset === 'custom' ? 'custom' : preset;
      const data = await getHistory(
        period,
        preset === 'custom' ? dateFrom : undefined,
        preset === 'custom' ? dateTo : undefined
      );
      setOrders(data.orders);
      setSummary(data.summary);
    } catch {
      setToast({ message: 'Tarixçə yüklənə bilmədi', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [preset, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (preset !== 'custom') {
      const range = getDateRange(preset);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }, [preset]);

  const handleExport = async () => {
    try {
      const period = preset === 'custom' ? 'custom' : preset;
      const blob = await exportHistoryExcel(
        period,
        preset === 'custom' ? dateFrom : undefined,
        preset === 'custom' ? dateTo : undefined
      );
      downloadBlob(blob, `tarixce_${dateFrom}_${dateTo}.xlsx`);
      setToast({ message: 'Excel faylı yükləndi', type: 'success' });
    } catch {
      setToast({ message: 'Export uğursuz oldu', type: 'error' });
    }
  };

  const presets: { key: DateRangePreset; label: string }[] = [
    { key: 'today', label: 'Bu gün' },
    { key: 'week', label: 'Bu həftə' },
    { key: 'month', label: 'Bu ay' },
    { key: 'custom', label: 'Tarix aralığı' },
  ];

  const unpaidCredit = useMemo(
    () => getUnpaidCreditDebt(orders, summary),
    [orders, summary]
  );
  const creditRevenue = useMemo(
    () => getCreditRevenue(orders, summary),
    [orders, summary]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPreset(p.key)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                preset === p.key
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button variant="secondary" onClick={handleExport} className="w-full sm:ml-auto sm:w-auto">
          <Download size={16} />
          Excel export
        </Button>
      </div>

      {preset === 'custom' && (
        <Card className="p-4">
          <DateFields
            dateFrom={dateFrom}
            dateTo={dateTo}
            setDateFrom={setDateFrom}
            setDateTo={setDateTo}
            onApply={load}
          />
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Tamamlanmış sifariş"
          value={loading ? '...' : summary?.totalOrders ?? 0}
          icon={<CheckCircle size={20} />}
          accent="emerald"
        />
        <StatCard
          title="Ümumi gəlir"
          value={loading ? '...' : formatCurrency(summary?.totalRevenue)}
          subtitle={
            loading || !summary
              ? undefined
              : 'Nağd + Kart + Nisyə (gəlir)'
          }
          icon={<TrendingUp size={20} />}
          accent="sky"
        />
        <StatCard
          title="Nağd"
          value={loading ? '...' : formatCurrency(summary?.cashRevenue)}
          icon={<Banknote size={20} />}
          accent="amber"
        />
        <StatCard
          title="Kart"
          value={loading ? '...' : formatCurrency(summary?.cardRevenue)}
          icon={<CreditCard size={20} />}
          accent="violet"
        />
        <StatCard
          title="Nisyə (gəlir)"
          value={loading ? '...' : formatCurrency(creditRevenue)}
          subtitle={loading ? undefined : 'Yalnız ödənilmiş nisyə'}
          icon={<CircleDollarSign size={20} />}
          accent="violet"
        />
        <StatCard
          title="Nisyə borcu"
          value={loading ? '...' : formatCurrency(unpaidCredit.amount)}
          subtitle={
            loading
              ? undefined
              : unpaidCredit.count > 0
                ? `${unpaidCredit.count} ödənilməmiş sifariş`
                : 'Ödənilməmiş borc yoxdur'
          }
          icon={<CircleDollarSign size={20} />}
          accent="rose"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
            Yerinə yetirilmiş sifarişlər ({orders.length})
          </h3>
          <p className="text-xs text-slate-500 sm:text-sm">
            {dateFrom} — {dateTo}
          </p>
        </div>
        <HistoryTable loading={loading} orders={orders} onMarkPaid={load} />
      </Card>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

function DateFields({
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  onApply,
}: {
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
      <Input
        label="Başlanğıc tarixi"
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
      />
      <Input
        label="Son tarix"
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
      />
      <Button type="button" variant="secondary" onClick={onApply} className="w-full sm:w-auto">
        Tətbiq et
      </Button>
    </div>
  );
}

const paymentStyles: Record<string, string> = {
  Nağd: 'bg-amber-50 text-amber-800 ring-amber-200',
  Kart: 'bg-violet-50 text-violet-800 ring-violet-200',
  Nisyə: 'bg-rose-50 text-rose-800 ring-rose-200',
};

function PaymentTypeCell({ order }: { order: Order }) {
  const label = getPaymentTypeLabel(order.payment_type);
  const style = paymentStyles[label] || 'bg-slate-50 text-slate-600 ring-slate-200';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}

function CreditRevenueCell({ order }: { order: Order }) {
  if (!isOrderCreditPayment(order)) {
    return <span className="text-slate-300">—</span>;
  }

  const amount = getOrderCreditRevenueAmount(order);
  if (amount > 0) {
    return <span className="font-medium text-emerald-700">{formatCurrency(amount)}</span>;
  }

  return <span className="text-xs font-medium text-slate-400">0 (borc)</span>;
}

function OrderPaidStatus({ order }: { order: Order }) {
  const paid = isOrderPaid(order);
  const label = getOrderPaidLabel(order);

  if (paid) {
    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <CheckCircle size={16} className="shrink-0" />
          {label}
        </span>
        {order.paid_at && (
          <p className="text-[11px] text-slate-400">{formatPaidAt(order.paid_at)}</p>
        )}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
      <XCircle size={16} className="shrink-0" />
      {label}
    </span>
  );
}

function HistoryTable({
  loading,
  orders,
  onMarkPaid,
}: {
  loading: boolean;
  orders: Order[];
  onMarkPaid: () => void;
}) {
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const { requestConfirm, ConfirmDialog } = useConfirm();

  const handleMarkPaid = async (order: Order) => {
    const ok = await requestConfirm({
      title: 'Borcu ödənildi et',
      message: `"${getOrderCustomerName(order)}" sifarişinin borcunu (${formatCurrency(order.price)}) ödənilmiş kimi qeyd etmək istəyirsiniz?`,
      confirmLabel: 'Ödənildi et',
      variant: 'success',
    });
    if (!ok) return;

    setMarkingId(order.id);
    try {
      await markOrderPaid(order.id);
      onMarkPaid();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Ödəniş qeydə alınmadı',
        type: 'error',
      });
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <>
    <TableScroll minWidth={920}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Müştəri</th>
            <th className="hidden px-3 py-2.5 md:table-cell sm:px-5 sm:py-3">Kuryer</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Bidon</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Qiymət</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Ödəniş</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Ödəndi</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Tarix</th>
            <th className="hidden px-3 py-2.5 sm:table-cell sm:px-5 sm:py-3">Status</th>
            <th className="px-3 py-2.5 text-right sm:px-5 sm:py-3">Əməliyyat</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9} className="px-3 py-12 text-center text-slate-400 sm:px-5">
                Yüklənir...
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-12 text-center text-slate-400 sm:px-5">
                Bu tarix aralığında tamamlanmış sifariş yoxdur
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-3 py-3 font-medium sm:px-5 sm:py-3.5">
                  <p>{getOrderCustomerName(order)}</p>
                  <p className="mt-0.5 text-xs text-slate-400 md:hidden">
                    {getOrderCourierName(order)}
                  </p>
                </td>
                <td className="hidden px-3 py-3 text-slate-600 md:table-cell sm:px-5 sm:py-3.5">
                  {getOrderCourierName(order)}
                </td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5">{getOrderBidonCount(order)}</td>
                <td className="px-3 py-3 font-medium sm:px-5 sm:py-3.5">{formatCurrency(order.price)}</td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                  <PaymentTypeCell order={order} />
                </td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                  <OrderPaidStatus order={order} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-600 sm:px-5 sm:py-3.5">
                  {getOrderDate(order)}
                </td>
                <td className="hidden px-3 py-3 sm:table-cell sm:px-5 sm:py-3.5">
                  <Badge variant={orderStatusVariant(order.status)}>
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right sm:px-5 sm:py-3.5">
                  {!isOrderPaid(order) ? (
                    <Button
                      type="button"
                      variant="success"
                      loading={markingId === order.id}
                      onClick={() => handleMarkPaid(order)}
                      className="ml-auto w-full whitespace-nowrap px-3 text-xs sm:w-auto sm:py-1.5"
                    >
                      Ödənildi et
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableScroll>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {ConfirmDialog}
    </>
  );
}
