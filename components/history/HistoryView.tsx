'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Download,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Banknote,
  CreditCard,
  CircleDollarSign,
  XCircle,
  Wallet,
  Plus,
} from 'lucide-react';
import {
  createExpense,
  exportHistoryExcel,
  getHistory,
  getMigrationErrorHint,
  isBackendMigrationError,
} from '@/lib/api';
import type { DebtPayment, Expense, HistorySummary, Order } from '@/lib/types';
import {
  downloadBlob,
  getExportErrorMessage,
  getExportSuccessMessage,
} from '@/lib/download';
import {
  formatCurrency,
  formatDateTime,
  resolveApiPeriodParams,
  getExpenseCategoryLabel,
  getDebtCollected,
  getNetRevenue,
  getOrderBidonCount,
  getOrderCourierName,
  getOrderCustomerName,
  getOrderDate,
  getOrderRevenue,
  getOrderStatusLabel,
  formatPaidAt,
  getCreditRevenue,
  getPaymentTypeLabel,
  getTotalExpenses,
  getUnpaidCreditDebt,
  isOrderPaid,
  parseExpenseAmount,
  getExpenseAuthorLabel,
  isAdminExpense,
  getOrderAmountPaid,
  getOrderRemainingAmount,
  getOrderCustomerDebt,
  canMarkOrderDebtPaid,
  getOrderPrice,
} from '@/lib/utils';
import { OrderDebtPaymentModal } from '@/components/history/OrderDebtPaymentModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, StatCard } from '@/components/ui/Card';
import { TableScroll } from '@/components/ui/TableScroll';
import { Badge, orderStatusVariant } from '@/components/ui/Badge';
import { Toast, ToastType } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { MobileOnly, DesktopOnly } from '@/components/ui/ResponsiveViews';
import {
  MobileCard,
  MobileCardActions,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
  MobileCardTitle,
  MobileEmpty,
} from '@/components/ui/MobileCards';
import {
  DateRangePresetButtons,
  useDateRangeState,
} from '@/components/ui/DateRangePresets';

export function HistoryView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { preset, setPreset, dateFrom, setDateFrom, dateTo, setDateTo } =
    useDateRangeState('today');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { period, startDate, endDate } = resolveApiPeriodParams(
        preset,
        dateFrom,
        dateTo
      );
      const data = await getHistory(period, startDate, endDate);
      setOrders(data.orders);
      setSummary(data.summary);
      setExpenses(data.expenses ?? []);
      setDebtPayments(data.debtPayments ?? []);
    } catch (err) {
      setToast({
        message: isBackendMigrationError(err)
          ? getMigrationErrorHint()
          : err instanceof Error
            ? err.message
            : 'Tarixçə yüklənə bilmədi',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [preset, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    try {
      const { period, startDate, endDate } = resolveApiPeriodParams(
        preset,
        dateFrom,
        dateTo
      );
      const blob = await exportHistoryExcel(period, startDate, endDate);
      await downloadBlob(blob, `tarixce_${startDate}_${endDate}.xlsx`);
      setToast({ message: getExportSuccessMessage(), type: 'success' });
    } catch (err) {
      setToast({ message: getExportErrorMessage(err), type: 'error' });
    }
  };

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
        <DateRangePresetButtons preset={preset} onPresetChange={setPreset} />
        <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => setExpenseModalOpen(true)}
            className="w-full sm:w-auto"
          >
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
          title="Ümumi xərclər"
          value={loading ? '...' : formatCurrency(getTotalExpenses(summary))}
          subtitle={
            loading
              ? undefined
              : 'Kuryer + şirkət xərcləri — xalis gəlirdən çıxılır'
          }
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

      <ExpensesTable loading={loading} expenses={expenses} />

      <AddAdminExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSaved={() => {
          setExpenseModalOpen(false);
          load();
        }}
        onError={(message) => setToast({ message, type: 'error' })}
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

function ExpensesTable({
  loading,
  expenses,
}: {
  loading: boolean;
  expenses: Expense[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
          Xərclər ({expenses.length})
        </h3>
        <p className="text-xs text-slate-500 sm:text-sm">
          Kuryer xərcləri + adminin qeyd etdiyi şirkət xərcləri (yanacaq, icarə, materiallar və s.)
        </p>
      </div>
      <MobileOnly>
        <div className="p-3">
          {loading ? (
            <MobileEmpty>Yüklənir...</MobileEmpty>
          ) : expenses.length === 0 ? (
            <MobileEmpty>Bu dövrdə xərc yoxdur</MobileEmpty>
          ) : (
            <MobileCardList>
              {expenses.map((e) => (
                <MobileCard key={e.id} className={isAdminExpense(e) ? 'border-amber-200 bg-amber-50/30' : ''}>
                  <MobileCardTitle subtitle={formatDateTime(e.created_at)}>
                    {getExpenseAuthorLabel(e)} · {formatCurrency(parseExpenseAmount(e.amount))}
                  </MobileCardTitle>
                  <p className="text-sm text-slate-700">{e.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {getExpenseCategoryLabel(e.category)}
                  </p>
                </MobileCard>
              ))}
            </MobileCardList>
          )}
        </div>
      </MobileOnly>
      <DesktopOnly>
      <TableScroll minWidth={560}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Mənbə</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Məbləğ</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Təsvir</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Kateqoriya</th>
              <th className="px-3 py-2.5 sm:px-5 sm:py-3">Tarix</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-slate-400">
                  Yüklənir...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-slate-400">
                  Bu dövrdə xərc yoxdur
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr
                  key={e.id}
                  className={`border-b border-slate-50 hover:bg-slate-50/50 ${
                    isAdminExpense(e) ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <td className="px-3 py-3 font-medium sm:px-5 sm:py-3.5">
                    {getExpenseAuthorLabel(e)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-rose-700 sm:px-5 sm:py-3.5">
                    {formatCurrency(parseExpenseAmount(e.amount))}
                  </td>
                  <td className="px-3 py-3 text-slate-600 sm:px-5 sm:py-3.5">{e.description}</td>
                  <td className="px-3 py-3 text-slate-500 sm:px-5 sm:py-3.5">
                    {getExpenseCategoryLabel(e.category)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-500 sm:px-5 sm:py-3.5">
                    {formatDateTime(e.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScroll>
      </DesktopOnly>
    </Card>
  );
}

const ADMIN_EXPENSE_CATEGORIES = [
  { value: 'payroll', label: 'Əmək haqqı / ödənişlər' },
  { value: 'fuel', label: 'Yanacaq, nəqliyyat' },
  { value: 'supplies', label: 'Materiallar, təchizat' },
  { value: 'rent', label: 'İcarə, kommunal' },
  { value: 'equipment', label: 'Avadanlıq, təmir' },
  { value: 'other', label: 'Digər xərc' },
];

function AddAdminExpenseModal({
  open,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount('');
      setDescription('');
      setCategory('other');
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      onError('Məbləğ düzgün daxil edin');
      return;
    }
    if (!description.trim()) {
      onError('Təsvir mütləqdir');
      return;
    }
    setSaving(true);
    try {
      await createExpense({
        amount: value,
        description: description.trim(),
        category,
        source: 'admin',
      });
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Xərc əlavə edilmədi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Şirkət xərci əlavə et"
      size="md"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Ləğv et
          </Button>
          <Button type="submit" form="admin-expense-form" loading={saving} className="w-full sm:w-auto">
            Əlavə et
          </Button>
        </div>
      }
    >
      <form id="admin-expense-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Input
          label="Məbləğ (₼)"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(ev) => setAmount(ev.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Kateqoriya</label>
          <select
            value={category}
            onChange={(ev) => setCategory(ev.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            {ADMIN_EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Təsvir"
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
          placeholder="Məs: Ofis icarəsi, yanacaq, kuryer ödənişi..."
          required
        />
      </form>
    </Modal>
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
      <MobileOnly>
        <div className="p-3">
          {loading ? (
            <MobileEmpty>Yüklənir...</MobileEmpty>
          ) : payments.length === 0 ? (
            <MobileEmpty>Bu dövrdə borc ödənişi yoxdur</MobileEmpty>
          ) : (
            <MobileCardList>
              {payments.map((p, i) => (
                <MobileCard key={p.id ?? i}>
                  <MobileCardTitle subtitle={formatDateTime(p.created_at)}>
                    {p.customer_name || '—'}
                  </MobileCardTitle>
                  <MobileCardGrid>
                    <MobileCardField
                      label="Ödənilən"
                      value={formatCurrency(p.amount)}
                      valueClassName="text-emerald-700"
                    />
                    <MobileCardField
                      label="Borc"
                      value={
                        p.previous_debt != null && p.new_debt != null
                          ? `${formatCurrency(p.previous_debt)} → ${formatCurrency(p.new_debt)}`
                          : '—'
                      }
                    />
                  </MobileCardGrid>
                </MobileCard>
              ))}
            </MobileCardList>
          )}
        </div>
      </MobileOnly>
      <DesktopOnly>
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
      </DesktopOnly>
    </Card>
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
  const remaining = getOrderRemainingAmount(order);
  const amountPaid = getOrderAmountPaid(order);

  if (paid) {
    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <CheckCircle size={16} className="shrink-0" />
          Ödənilib
        </span>
        {order.paid_at && (
          <p className="text-[11px] text-slate-400">{formatPaidAt(order.paid_at)}</p>
        )}
      </div>
    );
  }

  if (amountPaid > 0) {
    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          Qismən ödənilib
        </span>
        <p className="text-[11px] text-slate-500">
          Ödənilib: {formatCurrency(amountPaid)} · Qalan: {formatCurrency(remaining)}
        </p>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
      <XCircle size={16} className="shrink-0" />
      Borc
    </span>
  );
}

function OrderPriceCell({ order }: { order: Order }) {
  const price = getOrderPrice(order);
  const paid = getOrderAmountPaid(order);
  const remaining = getOrderRemainingAmount(order);

  return (
    <div>
      <p className="font-medium">{formatCurrency(price)}</p>
      {paid > 0 && (
        <p className="mt-0.5 text-xs text-emerald-600">Ödənilib: {formatCurrency(paid)}</p>
      )}
      {!isOrderPaid(order) && remaining > 0 && (
        <p className="mt-0.5 text-xs font-medium text-red-600">Qalan: {formatCurrency(remaining)}</p>
      )}
    </div>
  );
}

function OrderCustomerCell({ order }: { order: Order }) {
  const debt = getOrderCustomerDebt(order);
  return (
    <div>
      <p>{getOrderCustomerName(order)}</p>
      {debt != null && debt > 0 && (
        <p className="mt-0.5 text-xs font-medium text-red-600">
          Müştəri borcu: {formatCurrency(debt)}
        </p>
      )}
      <p className="mt-0.5 text-xs text-slate-400 md:hidden">{getOrderCourierName(order)}</p>
    </div>
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
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  return (
    <>
    <MobileOnly>
      <div className="p-3">
      {loading ? (
        <MobileEmpty>Yüklənir...</MobileEmpty>
      ) : orders.length === 0 ? (
        <MobileEmpty>Bu tarix aralığında tamamlanmış sifariş yoxdur</MobileEmpty>
      ) : (
        <MobileCardList>
          {orders.map((order) => (
            <MobileCard key={order.id}>
              <MobileCardTitle subtitle={getOrderCourierName(order)}>
                {getOrderCustomerName(order)}
              </MobileCardTitle>
              {getOrderCustomerDebt(order) != null && getOrderCustomerDebt(order)! > 0 && (
                <p className="mb-2 text-xs font-medium text-red-600">
                  Müştəri borcu: {formatCurrency(getOrderCustomerDebt(order)!)}
                </p>
              )}
              <MobileCardGrid>
                <MobileCardField label="Bidon" value={getOrderBidonCount(order)} />
                <MobileCardField
                  label="Qiymət"
                  value={formatCurrency(getOrderPrice(order))}
                />
                <MobileCardField
                  label="Ödənilib"
                  value={formatCurrency(getOrderAmountPaid(order))}
                />
                <MobileCardField
                  label="Qalan"
                  value={formatCurrency(getOrderRemainingAmount(order))}
                  valueClassName={
                    getOrderRemainingAmount(order) > 0 ? 'text-red-600' : 'text-emerald-600'
                  }
                />
                <MobileCardField label="Tarix" value={getOrderDate(order)} />
                <MobileCardField label="Ödəniş" value={<PaymentTypeCell order={order} />} />
              </MobileCardGrid>
              <div className="mt-2">
                <OrderPaidStatus order={order} />
              </div>
              {canMarkOrderDebtPaid(order) && (
                <MobileCardActions>
                  <Button
                    type="button"
                    variant="success"
                    onClick={() => setPayOrder(order)}
                    className="w-full text-xs"
                  >
                    Borc ödə
                  </Button>
                </MobileCardActions>
              )}
            </MobileCard>
          ))}
        </MobileCardList>
      )}
      </div>
    </MobileOnly>
    <DesktopOnly>
    <TableScroll minWidth={920}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Müştəri</th>
            <th className="hidden px-3 py-2.5 md:table-cell sm:px-5 sm:py-3">Kuryer</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Bidon</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Qiymət / Qalan</th>
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
                <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                  <OrderCustomerCell order={order} />
                </td>
                <td className="hidden px-3 py-3 text-slate-600 md:table-cell sm:px-5 sm:py-3.5">
                  {getOrderCourierName(order)}
                </td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5">{getOrderBidonCount(order)}</td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                  <OrderPriceCell order={order} />
                </td>
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
                  {canMarkOrderDebtPaid(order) ? (
                    <Button
                      type="button"
                      variant="success"
                      onClick={() => setPayOrder(order)}
                      className="ml-auto w-full whitespace-nowrap px-3 text-xs sm:w-auto sm:py-1.5"
                    >
                      Borc ödə
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
    </DesktopOnly>

      <OrderDebtPaymentModal
        open={payOrder != null}
        order={payOrder}
        onClose={() => setPayOrder(null)}
        onSuccess={(message) => {
          setPayOrder(null);
          setToast({ message, type: 'success' });
          onMarkPaid();
        }}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
