'use client';

import { useState } from 'react';
import {
  Droplets,
  Banknote,
  CreditCard,
  Wallet,
  Truck,
  TrendingDown,
  Scale,
} from 'lucide-react';
import type {
  Expense,
  HistoryDashboard,
  HistoryDashboardByCourier,
} from '@/lib/types';
import {
  formatCurrency,
  getExpenseAuthorLabel,
  getOrderCustomerName,
  getOrderExtraLabel,
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
  | null;

export function HistoryDashboardCards({
  dashboard,
  expenses,
  loading,
  byCourier,
  showByCourier,
}: {
  dashboard: HistoryDashboard | null;
  expenses: Expense[];
  loading: boolean;
  byCourier?: HistoryDashboardByCourier[];
  /** Filter yoxdursa kuryer üzrə 7 qutu göstər */
  showByCourier?: boolean;
}) {
  const [modal, setModal] = useState<ModalKind>(null);

  const d = dashboard;
  const salesSubtitle =
    d && (d.sales.water_total > 0 || d.sales.extras_total > 0)
      ? `Su ${formatCurrency(d.sales.water_total)}${
          d.sales.extras_total > 0 ? ` · əlavə ${formatCurrency(d.sales.extras_total)}` : ''
        }`
      : undefined;

  const formula = d?.courier_balance.formula;
  const courierSubtitle = formula
    ? `${formatCurrency((formula.sales ?? 0) + (formula.debt_given ?? 0))} − ${formatCurrency(
        (formula.credit ?? 0) + (formula.prepaid ?? 0) + (formula.partial_unpaid ?? 0)
      )}`
    : undefined;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Satış"
          value={loading ? '...' : formatCurrency(d?.sales.total ?? 0)}
          subtitle={loading ? undefined : salesSubtitle}
          icon={<Droplets size={20} />}
          accent="sky"
          onClick={d?.sales ? () => setModal('sales') : undefined}
        />
        <StatCard
          title="Borc verildi"
          value={loading ? '...' : formatCurrency(d?.debt_given.total ?? 0)}
          subtitle={
            loading ? undefined : d?.debt_given.count ? `${d.debt_given.count} ödəniş` : undefined
          }
          icon={<Banknote size={20} />}
          accent="amber"
          onClick={d?.debt_given ? () => setModal('debt_given') : undefined}
        />
        <StatCard
          title="Nisyə"
          value={loading ? '...' : formatCurrency(d?.credit.total ?? 0)}
          subtitle={
            loading
              ? undefined
              : d?.credit.count
                ? `${d.credit.count} ödənilməmiş`
                : 'Ödənilməmiş nisyə'
          }
          icon={<CreditCard size={20} />}
          accent="violet"
          onClick={d?.credit ? () => setModal('credit') : undefined}
        />
        <StatCard
          title="Ödənilib"
          value={loading ? '...' : formatCurrency(d?.prepaid.total ?? 0)}
          subtitle={
            loading
              ? undefined
              : d?.prepaid.count
                ? `${d.prepaid.count} sifariş`
                : 'Əvvəlcədən ödəniş'
          }
          icon={<Wallet size={20} />}
          accent="emerald"
          onClick={d?.prepaid ? () => setModal('prepaid') : undefined}
        />
        <StatCard
          title="Kuryerdə qalıq"
          value={loading ? '...' : formatCurrency(d?.courier_balance.total ?? 0)}
          subtitle={loading ? undefined : courierSubtitle}
          icon={<Truck size={20} />}
          accent="sky"
          onClick={d?.courier_balance ? () => setModal('courier_balance') : undefined}
        />
        <StatCard
          title="Xərclər"
          value={loading ? '...' : formatCurrency(d?.expenses.total ?? 0)}
          icon={<TrendingDown size={20} />}
          accent="rose"
          onClick={() => setModal('expenses')}
        />
        <StatCard
          title="Qalıq"
          value={loading ? '...' : formatCurrency(d?.net_balance.total ?? 0)}
          subtitle="Kuryerdə qalıq − xərclər"
          icon={<Scale size={20} />}
          accent="emerald"
        />
      </div>

      {showByCourier && byCourier && byCourier.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Kuryer üzrə</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byCourier.map((row) => (
              <CourierDashboardCard key={row.courier_id} row={row} />
            ))}
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
        expenses={expenses}
      />
    </>
  );
}

function CourierDashboardCard({ row }: { row: HistoryDashboardByCourier }) {
  const d = row.dashboard;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 font-semibold text-slate-900">
        {row.courier_name || `Kuryer #${row.courier_id}`}
      </p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <Metric label="Satış" value={d.sales.total} />
        <Metric label="Borc verildi" value={d.debt_given.total} />
        <Metric label="Nisyə" value={d.credit.total} />
        <Metric label="Ödənilib" value={d.prepaid.total} />
        <Metric label="Kuryerdə" value={d.courier_balance.total} />
        <Metric label="Xərclər" value={d.expenses.total} />
        <Metric label="Qalıq" value={d.net_balance.total} highlight />
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
  return (
    <Modal open={open} onClose={onClose} title="Satış detalları" size="lg">
      {!d ? null : (
        <div className="space-y-4">
          {d.sales.water.length > 0 && (
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
                    {d.sales.water.map((row, i) => (
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
          {d.sales.extras.length > 0 && (
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
                    {d.sales.extras.map((row, i) => (
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
          {d.sales.by_courier && d.sales.by_courier.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Kuryer üzrə</h3>
              <ul className="space-y-2 text-sm">
                {d.sales.by_courier.map((row, i) => (
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
          {d.sales.orders && d.sales.orders.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Sifarişlər</h3>
              <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
                {d.sales.orders.map((o) => (
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
          {!d.sales.water.length &&
            !d.sales.extras.length &&
            !(d.sales.orders && d.sales.orders.length) && (
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
      {!dashboard?.debt_given.customers.length ? (
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
                {row.order_id != null && (
                  <p className="text-xs text-slate-500">Sifariş #{row.order_id}</p>
                )}
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
  const orders = dashboard?.credit.orders ?? [];
  return (
    <Modal open={open} onClose={onClose} title="Nisyə (ödənilməmiş)" size="md">
      <p className="mb-3 text-xs text-slate-500">
        Yalnız Nisyə ilə tamamlanmış və hələ ödənilməmiş sifarişlər. Borc ödəniləndə bu qutudan
        çıxır.
      </p>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">
          {dashboard?.credit.total
            ? `Cəmi: ${formatCurrency(dashboard.credit.total)}`
            : 'Ödənilməmiş Nisyə yoxdur.'}
        </p>
      ) : (
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
  const orders = dashboard?.prepaid.orders ?? [];
  return (
    <Modal open={open} onClose={onClose} title="Ödənilib (əvvəlcədən)" size="md">
      <p className="mb-3 text-xs text-slate-500">
        Təyinat zamanı ödənilmiş sifarişlər — kuryer tamamlayanda təkrar pul almır.
      </p>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">
          {dashboard?.prepaid.total
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
  const f = dashboard?.courier_balance.formula;
  return (
    <Modal open={open} onClose={onClose} title="Kuryerdə qalıq" size="md">
      {!dashboard ? null : (
        <div className="space-y-3 text-sm">
          <p className="rounded-lg bg-sky-50 px-3 py-2 font-semibold text-sky-900 ring-1 ring-sky-100">
            {formatCurrency(dashboard.courier_balance.total)}
          </p>
          <p className="text-xs text-slate-500">
            (Satış + Borc verildi) − (Nisyə + Ödənilib + qismən nağd/kart qalığı)
          </p>
          {f && (
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <Metric label="Satış" value={f.sales ?? 0} />
              <Metric label="Borc verildi" value={f.debt_given ?? 0} />
              <Metric label="Nisyə" value={f.credit ?? 0} />
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
}: {
  open: boolean;
  onClose: () => void;
  expenses: Expense[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="Xərclər" size="lg">
      {expenses.length === 0 ? (
        <p className="text-sm text-slate-500">Bu periodda xərc yoxdur.</p>
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
