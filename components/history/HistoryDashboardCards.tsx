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
import type { Expense, HistoryDashboard } from '@/lib/types';
import {
  formatCurrency,
  getExpenseAuthorLabel,
  getOrderCustomerName,
  getOrderExtraLabel,
  parseExpenseAmount,
} from '@/lib/utils';
import { StatCard } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { TableScroll } from '@/components/ui/TableScroll';

type ModalKind = 'sales' | 'debt_given' | 'expenses' | null;

export function HistoryDashboardCards({
  dashboard,
  expenses,
  loading,
}: {
  dashboard: HistoryDashboard | null;
  expenses: Expense[];
  loading: boolean;
}) {
  const [modal, setModal] = useState<ModalKind>(null);

  const d = dashboard;
  const salesSubtitle =
    d && d.sales.water_total > 0
      ? `Su ${formatCurrency(d.sales.water_total)}${
          d.sales.extras_total > 0 ? ` · əlavə ${formatCurrency(d.sales.extras_total)}` : ''
        }`
      : undefined;

  const courierSubtitle =
    d?.courier_balance.formula != null
      ? `Satış − (nişə + ödənilib + qismən)`
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
          subtitle={loading ? undefined : d?.debt_given.count ? `${d.debt_given.count} ödəniş` : undefined}
          icon={<Banknote size={20} />}
          accent="amber"
          onClick={d?.debt_given ? () => setModal('debt_given') : undefined}
        />
        <StatCard
          title="Nişə"
          value={loading ? '...' : formatCurrency(d?.credit.total ?? 0)}
          subtitle={loading ? undefined : d?.credit.count ? `${d.credit.count} sifariş` : undefined}
          icon={<CreditCard size={20} />}
          accent="violet"
        />
        <StatCard
          title="Ödənilib"
          value={loading ? '...' : formatCurrency(d?.prepaid.total ?? 0)}
          subtitle={loading ? undefined : d?.prepaid.count ? `${d.prepaid.count} sifariş` : undefined}
          icon={<Wallet size={20} />}
          accent="emerald"
        />
        <StatCard
          title="Kuryerdə qalıq"
          value={loading ? '...' : formatCurrency(d?.courier_balance.total ?? 0)}
          subtitle={loading ? undefined : courierSubtitle}
          icon={<Truck size={20} />}
          accent="sky"
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

      <Modal
        open={modal === 'sales'}
        onClose={() => setModal(null)}
        title="Satış detalları"
        size="lg"
      >
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
          </div>
        )}
      </Modal>

      <Modal
        open={modal === 'debt_given'}
        onClose={() => setModal(null)}
        title="Borc verildi"
        size="md"
      >
        {!d?.debt_given.customers.length ? (
          <p className="text-sm text-slate-500">Bu periodda qeyd yoxdur.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {d.debt_given.customers.map((row, i) => (
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

      <Modal
        open={modal === 'expenses'}
        onClose={() => setModal(null)}
        title="Xərclər"
        size="lg"
      >
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
                    <td className="py-2 pr-3 font-medium">{formatCurrency(parseExpenseAmount(e.amount))}</td>
                    <td className="py-2 text-slate-600">{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Modal>
    </>
  );
}
