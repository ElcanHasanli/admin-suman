'use client';

import { useEffect, useState } from 'react';
import {
  Droplets,
  Banknote,
  CreditCard,
  Wallet,
  Truck,
  TrendingDown,
  Scale,
  PackageCheck,
  PackageMinus,
  PiggyBank,
} from 'lucide-react';
import type {
  Expense,
  HistoryDashboard,
  HistoryDashboardBidonBox,
  HistoryDashboardByCourier,
  HistoryDashboardDepositsBox,
  HistoryReportTab,
} from '@/lib/types';
import {
  formatCurrency,
  formatDateTime,
  getDepositEntryTypeLabel,
  getExpenseAuthorLabel,
  getOrderCustomerName,
  getOrderExtraLabel,
  getPaymentTypeLabel,
  parseExpenseAmount,
  parseMoney,
} from '@/lib/utils';
import { StatCard } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { TableScroll } from '@/components/ui/TableScroll';

type ModalKind =
  | 'sales'
  | 'debt_given'
  | 'credit'
  | 'prepaid'
  | 'courier_balance'
  | 'expenses'
  | 'bidons_sold'
  | 'bidons_taken'
  | 'deposits'
  | 'net_income'
  | null;

export function HistoryDashboardCards({
  dashboard,
  expenses,
  loading,
  byCourier,
  showByCourier,
  mode = 'daily',
  expenseQ = '',
  onExpenseQChange,
}: {
  dashboard: HistoryDashboard | null;
  expenses: Expense[];
  loading: boolean;
  byCourier?: HistoryDashboardByCourier[];
  showByCourier?: boolean;
  mode?: HistoryReportTab;
  expenseQ?: string;
  onExpenseQChange?: (q: string) => void;
}) {
  const [modal, setModal] = useState<ModalKind>(null);
  const isMonthly = mode === 'monthly';

  const d = dashboard;
  const sales = d?.sales;
  const salesSubtitle =
    sales && ((sales.water_total ?? 0) > 0 || (sales.extras_total ?? 0) > 0)
      ? `Su ${formatCurrency(sales.water_total)}${
          (sales.extras_total ?? 0) > 0 ? ` · əlavə ${formatCurrency(sales.extras_total)}` : ''
        }`
      : undefined;

  const formula = d?.courier_balance?.formula;
  const courierSubtitle = formula
    ? `${formatCurrency((formula.sales ?? 0) + (formula.debt_given ?? 0))} − ${formatCurrency(
        (formula.credit ?? 0) + (formula.prepaid ?? 0) + (formula.partial_unpaid ?? 0)
      )}`
    : undefined;

  const expenseList =
    d?.expenses?.items && d.expenses.items.length > 0 ? d.expenses.items : expenses;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Satış"
          value={loading ? '...' : formatCurrency(d?.sales?.total ?? 0)}
          subtitle={loading ? undefined : salesSubtitle}
          icon={<Droplets size={20} />}
          accent="sky"
          onClick={sales ? () => setModal('sales') : undefined}
        />
        {!isMonthly && (
          <StatCard
            title="Borc verildi"
            value={loading ? '...' : formatCurrency(d?.debt_given?.total ?? 0)}
            subtitle={
              loading
                ? undefined
                : d?.debt_given?.count
                  ? `${d.debt_given.count} ödəniş`
                  : undefined
            }
            icon={<Banknote size={20} />}
            accent="amber"
            onClick={d?.debt_given ? () => setModal('debt_given') : undefined}
          />
        )}
        <StatCard
          title="Nisyə"
          value={loading ? '...' : formatCurrency(d?.credit?.total ?? 0)}
          subtitle={
            loading
              ? undefined
              : d?.credit?.count
                ? `${d.credit.count} ödənilməmiş`
                : 'Ödənilməmiş nisyə'
          }
          icon={<CreditCard size={20} />}
          accent="violet"
          onClick={d?.credit ? () => setModal('credit') : undefined}
        />
        {!isMonthly && (
          <>
            <StatCard
              title="Ödənilib"
              value={loading ? '...' : formatCurrency(d?.prepaid?.total ?? 0)}
              subtitle={
                loading
                  ? undefined
                  : d?.prepaid?.count
                    ? `${d.prepaid.count} sifariş`
                    : 'Əvvəlcədən ödəniş'
              }
              icon={<Wallet size={20} />}
              accent="emerald"
              onClick={d?.prepaid ? () => setModal('prepaid') : undefined}
            />
            <StatCard
              title="Kuryerdə qalıq"
              value={loading ? '...' : formatCurrency(d?.courier_balance?.total ?? 0)}
              subtitle={loading ? undefined : courierSubtitle}
              icon={<Truck size={20} />}
              accent="sky"
              onClick={d?.courier_balance ? () => setModal('courier_balance') : undefined}
            />
          </>
        )}
        <StatCard
          title="Xərclər"
          value={loading ? '...' : formatCurrency(d?.expenses?.total ?? 0)}
          icon={<TrendingDown size={20} />}
          accent="rose"
          onClick={() => setModal('expenses')}
        />
        {!isMonthly && (
          <StatCard
            title="Qalıq"
            value={loading ? '...' : formatCurrency(d?.net_balance?.total ?? 0)}
            subtitle="Kuryerdə qalıq − xərclər"
            icon={<Scale size={20} />}
            accent="emerald"
          />
        )}
        <StatCard
          title="Satılan bidon"
          value={loading ? '...' : String(d?.bidons_sold?.total ?? 0)}
          subtitle={
            loading
              ? undefined
              : d?.bidons_sold?.count
                ? `${d.bidons_sold.count} sifariş · bidon`
                : 'Dolu verilən'
          }
          icon={<PackageCheck size={20} />}
          accent="sky"
          onClick={d?.bidons_sold ? () => setModal('bidons_sold') : undefined}
        />
        <StatCard
          title="Götürülən bidon"
          value={loading ? '...' : String(d?.bidons_taken?.total ?? 0)}
          subtitle={
            loading
              ? undefined
              : d?.bidons_taken?.count
                ? `${d.bidons_taken.count} sifariş · bidon`
                : 'Boş alınan'
          }
          icon={<PackageMinus size={20} />}
          accent="violet"
          onClick={d?.bidons_taken ? () => setModal('bidons_taken') : undefined}
        />
        {!isMonthly && (
          <StatCard
            title="Depozit"
            value={
              loading
                ? '...'
                : formatCurrency(d?.deposits?.entered ?? d?.deposits?.total ?? 0)
            }
            subtitle={
              loading
                ? undefined
                : d?.deposits?.count
                  ? `${d.deposits.count} əməliyyat`
                  : 'Bu periodda daxil'
            }
            icon={<PiggyBank size={20} />}
            accent="amber"
            onClick={d?.deposits ? () => setModal('deposits') : undefined}
          />
        )}
        {isMonthly && (
          <StatCard
            title="Xalis gəlir"
            value={loading ? '...' : formatCurrency(d?.net_income?.total ?? 0)}
            subtitle={loading ? undefined : 'satış − xərclər'}
            icon={<Scale size={20} />}
            accent="emerald"
            onClick={d?.net_income ? () => setModal('net_income') : undefined}
          />
        )}
      </div>

      {!isMonthly && showByCourier && byCourier && byCourier.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Kuryer üzrə</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byCourier.map((row) =>
              row?.dashboard ? (
                <CourierDashboardCard key={row.courier_id} row={row} />
              ) : null
            )}
          </div>
        </div>
      )}

      <SalesModal open={modal === 'sales'} onClose={() => setModal(null)} dashboard={d} />
      <DebtGivenModal open={modal === 'debt_given'} onClose={() => setModal(null)} dashboard={d} />
      <CreditModal open={modal === 'credit'} onClose={() => setModal(null)} dashboard={d} />
      <PrepaidModal open={modal === 'prepaid'} onClose={() => setModal(null)} dashboard={d} />
      <CourierBalanceModal
        open={modal === 'courier_balance'}
        onClose={() => setModal(null)}
        dashboard={d}
      />
      <ExpensesModal
        open={modal === 'expenses'}
        onClose={() => setModal(null)}
        expenses={expenseList}
        expenseQ={expenseQ}
        onExpenseQChange={onExpenseQChange}
      />
      <BidonsModal
        open={modal === 'bidons_sold'}
        onClose={() => setModal(null)}
        box={d?.bidons_sold ?? null}
        title="Satılan bidon"
        hint="Çatdırılmada müştəriyə verilən dolu bidon sayı. Anbar götürmələri buraya daxil deyil."
      />
      <BidonsModal
        open={modal === 'bidons_taken'}
        onClose={() => setModal(null)}
        box={d?.bidons_taken ?? null}
        title="Götürülən bidon"
        hint="Müştəridən alınan boş bidon sayı (çatdırılma + pickup)."
      />
      <DepositsModal
        open={modal === 'deposits'}
        onClose={() => setModal(null)}
        box={d?.deposits ?? null}
      />
      <NetIncomeModal
        open={modal === 'net_income'}
        onClose={() => setModal(null)}
        dashboard={d}
      />
    </>
  );
}

function CourierDashboardCard({ row }: { row: HistoryDashboardByCourier }) {
  const d = row.dashboard;
  if (!d) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 font-semibold text-slate-900">
        {row.courier_name || `Kuryer #${row.courier_id}`}
      </p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <Metric label="Satış" value={d.sales?.total ?? 0} />
        <Metric label="Borc verildi" value={d.debt_given?.total ?? 0} />
        <Metric label="Nisyə" value={d.credit?.total ?? 0} />
        <Metric label="Ödənilib" value={d.prepaid?.total ?? 0} />
        <Metric label="Kuryerdə" value={d.courier_balance?.total ?? 0} />
        <Metric label="Xərclər" value={d.expenses?.total ?? 0} />
        <Metric label="Qalıq" value={d.net_balance?.total ?? 0} highlight />
        <MetricCount label="Satılan bidon" value={d.bidons_sold?.total ?? 0} />
        <MetricCount label="Götürülən bidon" value={d.bidons_taken?.total ?? 0} />
      </dl>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className={`font-semibold ${highlight ? 'text-emerald-700' : 'text-slate-800'}`}>
        {formatCurrency(value)}
      </dd>
    </div>
  );
}

function MetricCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-semibold text-slate-800">{value} bidon</dd>
    </div>
  );
}

function SalesModal({
  open,
  onClose,
  dashboard,
}: {
  open: boolean;
  onClose: () => void;
  dashboard: HistoryDashboard | null;
}) {
  const d = dashboard;
  const water = d?.sales?.water ?? [];
  const extras = d?.sales?.extras ?? [];
  const byCourier = d?.sales?.by_courier ?? [];
  const orders = d?.sales?.orders ?? [];
  return (
    <Modal open={open} onClose={onClose} title="Satış detalları" size="lg">
      {!d?.sales ? (
        <p className="text-sm text-slate-500">Bu periodda satış yoxdur.</p>
      ) : (
        <div className="space-y-4">
          {water.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Su</h3>
              <TableScroll minWidth={320}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-500">
                      <th className="py-2 pr-3">Vahid qiymət</th>
                      <th className="py-2 pr-3">Bidon</th>
                      <th className="py-2">Məbləğ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {water.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 pr-3">{formatCurrency(row.unit_price)}</td>
                        <td className="py-2 pr-3">{row.bidons}</td>
                        <td className="py-2 font-medium">{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </section>
          )}
          {extras.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Əlavələr</h3>
              <TableScroll minWidth={320}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-500">
                      <th className="py-2 pr-3">Növ</th>
                      <th className="py-2 pr-3">Say</th>
                      <th className="py-2">Məbləğ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extras.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 pr-3">{row.label || getOrderExtraLabel(row.type)}</td>
                        <td className="py-2 pr-3">{row.count}</td>
                        <td className="py-2 font-medium">{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </section>
          )}
          {byCourier.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Kuryer üzrə</h3>
              <ul className="space-y-2 text-sm">
                {byCourier.map((row, i) => (
                  <li
                    key={row.courier_id ?? i}
                    className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100"
                  >
                    <span>{row.courier_name || `Kuryer #${row.courier_id}`}</span>
                    <span className="font-medium">{formatCurrency(row.total ?? 0)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {orders.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Sifarişlər</h3>
              <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100"
                  >
                    <span>{getOrderCustomerName(o)}</span>
                    <span className="font-medium">{formatCurrency(o.price)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!water.length && !extras.length && !orders.length && (
            <p className="text-sm text-slate-500">Bu periodda satış yoxdur.</p>
          )}
        </div>
      )}
    </Modal>
  );
}

function DebtGivenModal({
  open,
  onClose,
  dashboard,
}: {
  open: boolean;
  onClose: () => void;
  dashboard: HistoryDashboard | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Borc verildi" size="md">
      {!dashboard?.debt_given?.customers?.length ? (
        <p className="text-sm text-slate-500">Bu periodda qeyd yoxdur.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {dashboard.debt_given.customers.map((row, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100"
            >
              <div>
                <p className="font-medium text-slate-900">{row.customer}</p>
                <p className="text-xs text-slate-500">
                  {row.order_id != null ? `Sifariş #${row.order_id}` : null}
                  {row.recorded_by_name
                    ? `${row.order_id != null ? ' · ' : ''}${row.recorded_by_name}${
                        row.recorded_by_role === 'admin' ? ' (admin)' : ''
                      }`
                    : null}
                </p>
              </div>
              <span className="font-semibold text-emerald-700">{formatCurrency(row.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function CreditModal({
  open,
  onClose,
  dashboard,
}: {
  open: boolean;
  onClose: () => void;
  dashboard: HistoryDashboard | null;
}) {
  const customers = dashboard?.credit?.customers ?? [];
  const orders = dashboard?.credit?.orders ?? [];
  const hasCustomers = customers.length > 0;
  return (
    <Modal open={open} onClose={onClose} title="nisyə (ödənilməmiş)" size="md">
      <p className="mb-3 text-xs text-slate-500">
        Ödənilməmiş qalıqlar: tam nisyə və qismən nağd/kart. Borc ödəniləndə bu qutudan çıxır.
      </p>
      {hasCustomers ? (
        <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
          {customers.map((row, i) => (
            <li
              key={`${row.order_id}-${i}`}
              className="flex justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-rose-100"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{row.customer}</p>
                <p className="text-xs text-slate-500">
                  #{row.order_id}
                  {row.kind === 'partial' ? ' · qismən' : ' · nisyə'}
                  {row.payment_type ? ` · ${getPaymentTypeLabel(row.payment_type)}` : ''}
                  {row.courier_name ? ` · ${row.courier_name}` : ''}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-rose-700">
                {formatCurrency(row.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : orders.length > 0 ? (
        <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
          {orders.map((o) => (
            <li
              key={o.id}
              className="flex justify-between rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-rose-100"
            >
              <span>{getOrderCustomerName(o)}</span>
              <span className="font-semibold text-rose-700">
                {formatCurrency(
                  o.remaining_amount != null && o.remaining_amount !== ''
                    ? parseMoney(o.remaining_amount)
                    : o.price
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">
          {dashboard?.credit?.total
            ? `Cəmi: ${formatCurrency(dashboard.credit.total)}`
            : 'Ödənilməmiş nisyə yoxdur.'}
        </p>
      )}
    </Modal>
  );
}

function PrepaidModal({
  open,
  onClose,
  dashboard,
}: {
  open: boolean;
  onClose: () => void;
  dashboard: HistoryDashboard | null;
}) {
  const orders = dashboard?.prepaid?.orders ?? [];
  return (
    <Modal open={open} onClose={onClose} title="Ödənilib (əvvəlcədən)" size="md">
      <p className="mb-3 text-xs text-slate-500">
        Təyinat zamanı ödənilmiş sifarişlər — kuryer tamamlayanda təkrar pul almır.
      </p>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">
          {dashboard?.prepaid?.total
            ? `Cəmi: ${formatCurrency(dashboard.prepaid.total)}`
            : 'Bu periodda ödənilib sifariş yoxdur.'}
        </p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
          {orders.map((o) => (
            <li
              key={o.id}
              className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100"
            >
              <span>{getOrderCustomerName(o)}</span>
              <span className="font-semibold text-emerald-700">
                {formatCurrency(o.prepaid_amount ?? o.price)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function CourierBalanceModal({
  open,
  onClose,
  dashboard,
}: {
  open: boolean;
  onClose: () => void;
  dashboard: HistoryDashboard | null;
}) {
  const f = dashboard?.courier_balance?.formula;
  return (
    <Modal open={open} onClose={onClose} title="Kuryerdə qalıq" size="md">
      {!dashboard?.courier_balance ? null : (
        <div className="space-y-3 text-sm">
          <p className="rounded-lg bg-sky-50 px-3 py-2 font-semibold text-sky-900 ring-1 ring-sky-100">
            {formatCurrency(dashboard.courier_balance.total)}
          </p>
          <p className="text-xs text-slate-500">
            (Satış + Borc verildi) − (nisyə + Ödənilib + qismən nağd/kart qalığı)
          </p>
          {f && (
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <Metric label="Satış" value={f.sales ?? 0} />
              <Metric label="Borc verildi" value={f.debt_given ?? 0} />
              <Metric label="nisyə" value={f.credit ?? 0} />
              <Metric label="Ödənilib" value={f.prepaid ?? 0} />
              <Metric label="Qismən qalıq" value={f.partial_unpaid ?? 0} />
            </dl>
          )}
        </div>
      )}
    </Modal>
  );
}

function ExpensesModal({
  open,
  onClose,
  expenses,
  expenseQ = '',
  onExpenseQChange,
}: {
  open: boolean;
  onClose: () => void;
  expenses: Expense[];
  expenseQ?: string;
  onExpenseQChange?: (q: string) => void;
}) {
  const [localQ, setLocalQ] = useState(expenseQ);

  useEffect(() => {
    if (open) setLocalQ(expenseQ);
  }, [open, expenseQ]);

  useEffect(() => {
    if (!onExpenseQChange) return;
    const t = setTimeout(() => {
      if (localQ !== expenseQ) onExpenseQChange(localQ);
    }, 300);
    return () => clearTimeout(t);
  }, [localQ, expenseQ, onExpenseQChange]);

  return (
    <Modal open={open} onClose={onClose} title="Xərclər" size="lg">
      <div className="mb-3">
        <input
          type="search"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder="Təsvirə görə axtar (məs. yanacaq)"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      {expenses.length === 0 ? (
        <p className="text-sm text-slate-500">
          {localQ.trim() ? 'Axtarışa uyğun xərc yoxdur.' : 'Bu periodda xərc yoxdur.'}
        </p>
      ) : (
        <TableScroll minWidth={400}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="py-2 pr-3">Mənbə</th>
                <th className="py-2 pr-3">Məbləğ</th>
                <th className="py-2">Təsvir</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-slate-50">
                  <td className="py-2 pr-3">{getExpenseAuthorLabel(e)}</td>
                  <td className="py-2 pr-3 font-medium">
                    {formatCurrency(parseExpenseAmount(e.amount))}
                  </td>
                  <td className="py-2 text-slate-600">{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </Modal>
  );
}

function NetIncomeModal({
  open,
  onClose,
  dashboard,
}: {
  open: boolean;
  onClose: () => void;
  dashboard: HistoryDashboard | null;
}) {
  const n = dashboard?.net_income;
  return (
    <Modal open={open} onClose={onClose} title="Xalis gəlir" size="md">
      {!n ? (
        <p className="text-sm text-slate-500">Məlumat yoxdur.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-900 ring-1 ring-emerald-100">
            {formatCurrency(n.total)}
          </p>
          <p className="text-xs text-slate-500">{n.formula || 'xalis_gəlir = satış − xərclər'}</p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <Metric label="Satış" value={n.sales ?? 0} />
            <Metric label="Xərclər" value={n.expenses ?? 0} />
          </dl>
        </div>
      )}
    </Modal>
  );
}

function BidonsModal({
  open,
  onClose,
  box,
  title,
  hint,
}: {
  open: boolean;
  onClose: () => void;
  box: HistoryDashboardBidonBox | null;
  title: string;
  hint: string;
}) {
  const items = box?.items ?? [];
  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <p className="mb-3 text-xs text-slate-500">{hint}</p>
      <p className="mb-3 rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900 ring-1 ring-sky-100">
        {box?.total ?? 0} bidon
        {box?.count ? (
          <span className="ml-2 font-normal text-sky-700/80">· {box.count} sifariş</span>
        ) : null}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Bu periodda qeyd yoxdur.</p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
          {items.map((row, i) => (
            <li
              key={`${row.order_id}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {row.customer || `Sifariş #${row.order_id}`}
                </p>
                <p className="text-xs text-slate-500">
                  #{row.order_id}
                  {row.courier_name ? ` · ${row.courier_name}` : ''}
                  {row.completed_at ? ` · ${formatDateTime(row.completed_at)}` : ''}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-sky-700">{row.bidons} bidon</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function DepositsModal({
  open,
  onClose,
  box,
}: {
  open: boolean;
  onClose: () => void;
  box: HistoryDashboardDepositsBox | null;
}) {
  const entries = box?.entries ?? [];
  return (
    <Modal open={open} onClose={onClose} title="Depozit" size="md">
      <dl className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
          <dt className="text-emerald-700/80">Girən</dt>
          <dd className="font-semibold text-emerald-800">
            {formatCurrency(box?.entered ?? box?.total ?? 0)}
          </dd>
        </div>
        <div className="rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-rose-100">
          <dt className="text-rose-700/80">Çıxan</dt>
          <dd className="font-semibold text-rose-800">{formatCurrency(box?.removed ?? 0)}</dd>
        </div>
      </dl>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">Bu periodda depozit qeydi yoxdur.</p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
          {entries.map((row, i) => {
            const amount = parseMoney(row.amount);
            return (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {row.customer || '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {getDepositEntryTypeLabel(row.entry_type)}
                    {row.recorded_by_name ? ` · ${row.recorded_by_name}` : ''}
                    {row.created_at ? ` · ${formatDateTime(row.created_at)}` : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-semibold ${
                    amount < 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {amount >= 0 ? '+' : ''}
                  {formatCurrency(amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
