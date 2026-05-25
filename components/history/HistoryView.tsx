'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Banknote,
  CreditCard,
  CircleDollarSign,
  XCircle,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  createExpense,
  deleteExpense,
  exportHistoryExcel,
  getCouriers,
  getHistory,
  markOrderPaid,
} from '@/lib/api';
import type {
  Courier,
  DateRangePreset,
  DebtPayment,
  Expense,
  HistorySummary,
  Order,
} from '@/lib/types';
import {
  downloadBlob,
  formatCurrency,
  formatDateTime,
  getCourierName,
  getDateRange,
  getDebtCollected,
  getNetRevenue,
  getOrderBidonCount,
  getOrderCourierName,
  getOrderCustomerName,
  getOrderDate,
  getOrderRevenue,
  getOrderStatusLabel,
  formatPaidAt,
  getOrderPaidLabel,
  getCreditRevenue,
  getPaymentTypeLabel,
  getTotalExpenses,
  getUnpaidCreditDebt,
  isOrderPaid,
  parseExpenseAmount,
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, StatCard } from '@/components/ui/Card';
import { TableScroll } from '@/components/ui/TableScroll';
import { Badge, orderStatusVariant } from '@/components/ui/Badge';
import { Toast, ToastType } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

export function HistoryView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<DateRangePreset>('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const { requestConfirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    getCouriers()
      .then(setCouriers)
      .catch(() => {});
  }, []);

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
      setExpenses(data.expenses ?? []);
      setDebtPayments(data.debtPayments ?? []);
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
        <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
          <Button variant="secondary" onClick={() => setExpenseModalOpen(true)} className="w-full sm:w-auto">
            <Plus size={16} />
            Xərc əlavə et
          </Button>
          <Button variant="secondary" onClick={handleExport} className="w-full sm:w-auto">
            <Download size={16} />
            Excel export
          </Button>
        </div>
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Xalis gəlir"
          value={loading ? '...' : formatCurrency(getNetRevenue(summary))}
          subtitle={
            loading || !summary
              ? undefined
              : `Gəlir ${formatCurrency(getOrderRevenue(summary))} − xərclər ${formatCurrency(getTotalExpenses(summary))}`
          }
          icon={<TrendingUp size={20} />}
          accent="emerald"
        />
        <StatCard
          title="Ümumi gəlir"
          value={loading ? '...' : formatCurrency(summary?.totalRevenue)}
          subtitle={
            loading || !summary
              ? undefined
              : `Sifariş ${formatCurrency(getOrderRevenue(summary))} + borc ${formatCurrency(getDebtCollected(summary))}`
          }
          icon={<Wallet size={20} />}
          accent="sky"
        />
        <StatCard
          title="Borc ödənişləri"
          value={loading ? '...' : formatCurrency(getDebtCollected(summary))}
          subtitle={loading ? undefined : `${debtPayments.length} qeyd`}
          icon={<Banknote size={20} />}
          accent="amber"
        />
        <StatCard
          title="Kuryer xərcləri"
          value={loading ? '...' : formatCurrency(getTotalExpenses(summary))}
          subtitle={loading ? undefined : `${expenses.length} xərc qeydi`}
          icon={<TrendingDown size={20} />}
          accent="rose"
        />
        <StatCard
          title="Tamamlanmış sifariş"
          value={loading ? '...' : summary?.totalOrders ?? 0}
          icon={<CheckCircle size={20} />}
          accent="violet"
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
      </div>

      {unpaidCredit.amount > 0 && (
        <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-800 ring-1 ring-rose-100">
          Nisyə borcu: {formatCurrency(unpaidCredit.amount)}
          {unpaidCredit.count > 0 ? ` (${unpaidCredit.count} ödənilməmiş sifariş)` : ''}
        </p>
      )}

      <ExpensesTable
        loading={loading}
        expenses={expenses}
        onDelete={async (id) => {
          const ok = await requestConfirm({
            title: 'Xərci sil',
            message: 'Bu xərc qeydini silmək istəyirsiniz?',
            confirmLabel: 'Sil',
            variant: 'danger',
          });
          if (!ok) return;
          try {
            await deleteExpense(id);
            setToast({ message: 'Xərc silindi', type: 'success' });
            load();
          } catch {
            setToast({ message: 'Silinmə uğursuz oldu', type: 'error' });
          }
        }}
      />

      <DebtPaymentsTable loading={loading} payments={debtPayments} />

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

      <AddExpenseModal
        open={expenseModalOpen}
        couriers={couriers}
        onClose={() => setExpenseModalOpen(false)}
        onSaved={() => {
          setExpenseModalOpen(false);
          setToast({ message: 'Xərc əlavə edildi', type: 'success' });
          load();
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {ConfirmDialog}
    </div>
  );
}

function ExpensesTable({
  loading,
  expenses,
  onDelete,
}: {
  loading: boolean;
  expenses: Expense[];
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
          Kuryer xərcləri ({expenses.length})
        </h3>
        <p className="text-xs text-slate-500 sm:text-sm">Yanacaq və digər xərclər</p>
      </div>
      <TableScroll minWidth={640}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Kuryer</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Məbləğ</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Təsvir</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Kateqoriya</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Tarix</th>
              <th className="px-3 py-2.5 text-right sm:px-5 sm:py-3">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                  Yüklənir...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                  Bu dövrdə xərc qeydi yoxdur
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-3 font-medium sm:px-5 sm:py-3.5">{e.courier_name}</td>
                  <td className="px-3 py-3 font-semibold text-rose-700 sm:px-5 sm:py-3.5">
                    {formatCurrency(parseExpenseAmount(e.amount))}
                  </td>
                  <td className="px-3 py-3 text-slate-600 sm:px-5 sm:py-3.5">{e.description}</td>
                  <td className="px-3 py-3 text-slate-500 sm:px-5 sm:py-3.5">{e.category || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-500 sm:px-5 sm:py-3.5">
                    {formatDateTime(e.created_at)}
                  </td>
                  <td className="px-3 py-3 text-right sm:px-5 sm:py-3.5">
                    <button
                      type="button"
                      onClick={() => onDelete(e.id)}
                      className="rounded-lg p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}

function DebtPaymentsTable({
  loading,
  payments,
}: {
  loading: boolean;
  payments: DebtPayment[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
          Borc ödənişləri ({payments.length})
        </h3>
        <p className="text-xs text-slate-500 sm:text-sm">Müştəri borcu azaldılanda</p>
      </div>
      <TableScroll minWidth={600}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Müştəri</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Ödənilən</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Əvvəl / Sonra</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Tarix</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-slate-400">
                  Yüklənir...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-slate-400">
                  Bu dövrdə borc ödənişi yoxdur
                </td>
              </tr>
            ) : (
              payments.map((p, i) => (
                <tr key={p.id ?? i} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-3 font-medium sm:px-5 sm:py-3.5">
                    {p.customer_name || '—'}
                  </td>
                  <td className="px-3 py-3 font-semibold text-emerald-700 sm:px-5 sm:py-3.5">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="px-3 py-3 text-slate-600 sm:px-5 sm:py-3.5">
                    {p.previous_debt != null && p.new_debt != null
                      ? `${formatCurrency(p.previous_debt)} → ${formatCurrency(p.new_debt)}`
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-500 sm:px-5 sm:py-3.5">
                    {formatDateTime(p.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}

function AddExpenseModal({
  open,
  couriers,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  couriers: Courier[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [courierId, setCourierId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setCourierId('');
      setAmount('');
      setDescription('');
      setCategory('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!courierId || !description.trim() || isNaN(amt) || amt <= 0) {
      onError('Kuryer, məbləğ və təsvir mütləqdir');
      return;
    }
    setSaving(true);
    try {
      await createExpense({
        courier_id: Number(courierId),
        amount: amt,
        description: description.trim(),
        category: category.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Xərc əlavə olunmadı');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Kuryer xərci əlavə et">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Kuryer</label>
          <select
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            required
          >
            <option value="">Seçin...</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {getCourierName(c)}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Məbləğ (₼)"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Input
          label="Təsvir"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Yanacaq, təmir..."
          required
        />
        <Input
          label="Kateqoriya (opsional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="yanacaq"
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Ləğv et
          </Button>
          <Button type="submit" loading={saving} className="w-full sm:w-auto">
            Əlavə et
          </Button>
        </div>
      </form>
    </Modal>
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
