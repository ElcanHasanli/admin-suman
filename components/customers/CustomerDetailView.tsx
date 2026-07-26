'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Plus,
  Package,
  Banknote,
  Phone,
  MapPin,
  Droplets,
  StickyNote,
  PiggyBank,
} from 'lucide-react';
import { getCustomerById } from '@/lib/api';
import type {
  CustomerDetailResponse,
  DebtPayment,
  DepositEntry,
  Order,
} from '@/lib/types';
import {
  formatCurrency,
  formatDateTime,
  getCustomerActiveBidons,
  getCustomerDebt,
  getCustomerDeposit,
  getCustomerName,
  getCustomerPhone,
  getCustomerPhone2,
  getCustomerPrice,
  getDepositEntryTypeLabel,
  getOrderEmptyBidonsReturned,
  getOrderFullBidonsGiven,
  formatOrderBidonSummary,
  getOrderCourierName,
  getOrderPaidLabel,
  getOrderStatusLabel,
  getPaymentTypeLabel,
  isOrderPaid,
  parseMoney,
  phoneToTel,
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { TableScroll } from '@/components/ui/TableScroll';
import { Badge, orderStatusVariant } from '@/components/ui/Badge';
import { Toast, ToastType } from '@/components/ui/Toast';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
import { MobileOnly, DesktopOnly } from '@/components/ui/ResponsiveViews';
import {
  MobileCard,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
  MobileCardTitle,
  MobileEmpty,
} from '@/components/ui/MobileCards';

export function CustomerDetailView({ customerId }: { customerId: number }) {
  const router = useRouter();
  const [data, setData] = useState<CustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(customerId) || customerId <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getCustomerById(customerId);
      setData(res);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Müştəri tapılmadı',
        type: 'error',
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="py-16 text-center text-slate-500">Yüklənir...</p>;
  }

  if (!data) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-slate-600">Müştəri tapılmadı</p>
        <Link href="/dashboard/customers/">
          <Button variant="secondary">Siyahıya qayıt</Button>
        </Link>
      </div>
    );
  }

  const { customer, stats, recent_orders, debt_payments, deposit_entries } = data;
  const debt = getCustomerDebt(customer);
  const deposit = getCustomerDeposit(customer);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/customers/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          <ArrowLeft size={18} />
          Müştərilər
        </Link>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={16} />
            Redaktə
          </Button>
          <Button
            onClick={() =>
              router.push(`/dashboard/orders/?customer_id=${customer.id}`)
            }
          >
            <Plus size={16} />
            Yeni sifariş
          </Button>
        </div>
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">{getCustomerName(customer)}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoRow
            icon={<Phone size={18} />}
            label="Telefon 1"
            value={
              getCustomerPhone(customer) ? (
                <a
                  href={phoneToTel(getCustomerPhone(customer))}
                  className="font-medium text-sky-600 hover:underline"
                >
                  {getCustomerPhone(customer)}
                </a>
              ) : (
                '—'
              )
            }
          />
          <InfoRow
            icon={<Phone size={18} />}
            label="Telefon 2"
            value={
              getCustomerPhone2(customer) ? (
                <a
                  href={phoneToTel(getCustomerPhone2(customer))}
                  className="font-medium text-sky-600 hover:underline"
                >
                  {getCustomerPhone2(customer)}
                </a>
              ) : (
                '—'
              )
            }
          />
          <InfoRow
            icon={<MapPin size={18} />}
            label="Ünvan"
            className="sm:col-span-2"
            value={
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
                {customer.address || '—'}
              </p>
            }
          />
          <InfoRow
            icon={<Droplets size={18} />}
            label="Qiymət"
            value={formatCurrency(getCustomerPrice(customer))}
          />
          <InfoRow
            icon={<Package size={18} />}
            label="Aktiv bidon"
            value={String(getCustomerActiveBidons(customer))}
          />
          <InfoRow
            icon={<PiggyBank size={18} />}
            label="Depozit"
            value={
              <span className="font-semibold text-slate-800">{formatCurrency(deposit)}</span>
            }
          />
          <InfoRow
            icon={<Banknote size={18} />}
            label="Cari borc"
            value={
              <span className={debt > 0 ? 'text-lg font-bold text-red-600' : 'font-semibold text-slate-800'}>
                {formatCurrency(debt)}
              </span>
            }
          />
          <InfoRow
            icon={<StickyNote size={18} />}
            label="Qeyd"
            className="sm:col-span-2"
            value={
              customer.notes?.trim() ? (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
                  {customer.notes}
                </p>
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard title="Cəmi sifariş" value={stats.total_orders} icon={<Package size={20} />} accent="sky" />
        <StatCard title="Tamamlanan" value={stats.completed_orders} icon={<Package size={20} />} accent="emerald" />
        <StatCard title="Aktiv" value={stats.active_orders} icon={<Package size={20} />} accent="violet" />
        <StatCard
          title="Son sifariş"
          value={stats.last_order_at ? formatDateTime(stats.last_order_at).slice(0, 10) : '—'}
          icon={<Package size={20} />}
          accent="amber"
        />
        <StatCard
          title="Son tamamlanma"
          value={
            stats.last_completed_at
              ? formatDateTime(stats.last_completed_at).slice(0, 10)
              : '—'
          }
          icon={<Package size={20} />}
          accent="amber"
        />
        <StatCard
          title="Sifariş cəmi"
          value={formatCurrency(parseMoney(stats.total_order_value))}
          icon={<Banknote size={20} />}
          accent="sky"
        />
      </div>

      <RecentOrdersTable
        orders={recent_orders}
        onOrderClick={(id) => router.push(`/dashboard/orders/?order_id=${id}`)}
      />

      <DepositEntriesTable entries={deposit_entries ?? []} />

      <DebtPaymentsTable payments={debt_payments} />

      <CustomerFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customer={customer}
        onSaved={load}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex gap-3 ${className}`}>
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <div className="mt-1">{value}</div>
      </div>
    </div>
  );
}

function RecentOrdersTable({
  orders,
  onOrderClick,
}: {
  orders: Order[];
  onOrderClick: (id: number) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h3 className="font-semibold text-slate-900">Son sifarişlər ({orders.length})</h3>
      </div>
      <MobileOnly>
        <div className="p-3">
          {orders.length === 0 ? (
            <MobileEmpty>Sifariş yoxdur</MobileEmpty>
          ) : (
            <MobileCardList>
              {orders.map((o) => (
                <MobileCard key={o.id} onClick={() => onOrderClick(o.id)}>
                  <MobileCardTitle
                    badge={
                      <Badge variant={orderStatusVariant(o.status)}>
                        {getOrderStatusLabel(o.status)}
                      </Badge>
                    }
                    subtitle={getOrderCourierName(o)}
                  >
                    {formatDateTime(o.created_at)}
                  </MobileCardTitle>
                  <MobileCardGrid>
                    <MobileCardField label="Bidon" value={formatOrderBidonSummary(o)} />
                    <MobileCardField label="Məbləğ" value={formatCurrency(parseMoney(o.price))} />
                    <MobileCardField label="Ödəniş" value={getPaymentTypeLabel(o.payment_type)} />
                    <MobileCardField
                      label="Status"
                      value={getOrderPaidLabel(o)}
                      valueClassName={isOrderPaid(o) ? 'text-emerald-600' : 'text-red-600'}
                    />
                  </MobileCardGrid>
                </MobileCard>
              ))}
            </MobileCardList>
          )}
        </div>
      </MobileOnly>
      <DesktopOnly>
      <TableScroll minWidth={640}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-3 py-2.5 sm:px-5">Tarix</th>
              <th className="px-3 py-2.5 sm:px-5">Status</th>
              <th className="px-3 py-2.5 sm:px-5">Verilən</th>
              <th className="px-3 py-2.5 sm:px-5">Götürülən</th>
              <th className="px-3 py-2.5 sm:px-5">Məbləğ</th>
              <th className="px-3 py-2.5 sm:px-5">Ödəniş</th>
              <th className="px-3 py-2.5 sm:px-5">Kuryer</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-400 sm:px-5">
                  Sifariş yoxdur
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const empty = getOrderEmptyBidonsReturned(o);
                return (
                <tr
                  key={o.id}
                  onClick={() => onOrderClick(o.id)}
                  className="cursor-pointer border-b border-slate-50 hover:bg-sky-50/50"
                >
                  <td className="whitespace-nowrap px-3 py-3 sm:px-5">
                    {formatDateTime(o.created_at)}
                  </td>
                  <td className="px-3 py-3 sm:px-5">
                    <Badge variant={orderStatusVariant(o.status)}>
                      {getOrderStatusLabel(o.status)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 font-medium text-sky-700 sm:px-5">
                    {getOrderFullBidonsGiven(o)}
                  </td>
                  <td className="px-3 py-3 text-slate-600 sm:px-5">
                    {empty == null ? '—' : empty}
                  </td>
                  <td className="px-3 py-3 font-medium sm:px-5">
                    {formatCurrency(parseMoney(o.price))}
                  </td>
                  <td className="px-3 py-3 sm:px-5">
                    <span className="block text-xs">{getPaymentTypeLabel(o.payment_type)}</span>
                    <span
                      className={`text-xs font-medium ${isOrderPaid(o) ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {getOrderPaidLabel(o)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600 sm:px-5">
                    {getOrderCourierName(o)}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableScroll>
      </DesktopOnly>
    </Card>
  );
}

function DepositEntriesTable({ entries }: { entries: DepositEntry[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h3 className="font-semibold text-slate-900">Depozit tarixçəsi ({entries.length})</h3>
      </div>
      <MobileOnly>
        <div className="p-3">
          {entries.length === 0 ? (
            <MobileEmpty>Depozit qeydi yoxdur</MobileEmpty>
          ) : (
            <MobileCardList>
              {entries.map((e, i) => {
                const amount = parseMoney(e.amount);
                return (
                  <MobileCard key={e.id ?? i}>
                    <MobileCardTitle
                      subtitle={e.created_at ? formatDateTime(e.created_at) : undefined}
                    >
                      <span className={amount < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        {amount >= 0 ? '+' : ''}
                        {formatCurrency(amount)}
                      </span>
                    </MobileCardTitle>
                    <MobileCardGrid>
                      <MobileCardField
                        label="Növ"
                        value={getDepositEntryTypeLabel(e.entry_type)}
                      />
                      <MobileCardField label="Qeyd edən" value={e.recorded_by_name || '—'} />
                    </MobileCardGrid>
                  </MobileCard>
                );
              })}
            </MobileCardList>
          )}
        </div>
      </MobileOnly>
      <DesktopOnly>
        <TableScroll minWidth={480}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-3 py-2.5 sm:px-5">Tarix</th>
                <th className="px-3 py-2.5 sm:px-5">Növ</th>
                <th className="px-3 py-2.5 sm:px-5">Məbləğ</th>
                <th className="px-3 py-2.5 sm:px-5">Qeyd edən</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-slate-400 sm:px-5">
                    Depozit qeydi yoxdur
                  </td>
                </tr>
              ) : (
                entries.map((e, i) => {
                  const amount = parseMoney(e.amount);
                  return (
                    <tr key={e.id ?? i} className="border-b border-slate-50">
                      <td className="whitespace-nowrap px-3 py-3 sm:px-5">
                        {e.created_at ? formatDateTime(e.created_at) : '—'}
                      </td>
                      <td className="px-3 py-3 text-slate-600 sm:px-5">
                        {getDepositEntryTypeLabel(e.entry_type)}
                      </td>
                      <td
                        className={`px-3 py-3 font-semibold sm:px-5 ${
                          amount < 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {amount >= 0 ? '+' : ''}
                        {formatCurrency(amount)}
                      </td>
                      <td className="px-3 py-3 text-slate-600 sm:px-5">
                        {e.recorded_by_name || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableScroll>
      </DesktopOnly>
    </Card>
  );
}

function DebtPaymentsTable({ payments }: { payments: DebtPayment[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h3 className="font-semibold text-slate-900">Borc ödənişləri ({payments.length})</h3>
      </div>
      <MobileOnly>
        <div className="p-3">
          {payments.length === 0 ? (
            <MobileEmpty>Borc ödənişi yoxdur</MobileEmpty>
          ) : (
            <MobileCardList>
              {payments.map((p, i) => (
                <MobileCard key={p.id ?? i}>
                  <MobileCardTitle subtitle={formatDateTime(p.created_at)}>
                    {formatCurrency(parseMoney(p.amount))}
                  </MobileCardTitle>
                  <MobileCardGrid>
                    <MobileCardField
                      label="Əvvəl / Sonra"
                      value={
                        p.previous_debt != null && p.new_debt != null
                          ? `${formatCurrency(parseMoney(p.previous_debt))} → ${formatCurrency(parseMoney(p.new_debt))}`
                          : '—'
                      }
                      className="col-span-2"
                    />
                    <MobileCardField
                      label="Qeyd edən"
                      value={p.recorded_by_name || '—'}
                      className="col-span-2"
                    />
                  </MobileCardGrid>
                </MobileCard>
              ))}
            </MobileCardList>
          )}
        </div>
      </MobileOnly>
      <DesktopOnly>
      <TableScroll minWidth={520}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-3 py-2.5 sm:px-5">Tarix</th>
              <th className="px-3 py-2.5 sm:px-5">Ödənilən</th>
              <th className="px-3 py-2.5 sm:px-5">Əvvəl / Sonra</th>
              <th className="px-3 py-2.5 sm:px-5">Qeyd edən</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-slate-400 sm:px-5">
                  Borc ödənişi yoxdur
                </td>
              </tr>
            ) : (
              payments.map((p, i) => (
                <tr key={p.id ?? i} className="border-b border-slate-50">
                  <td className="whitespace-nowrap px-3 py-3 sm:px-5">
                    {formatDateTime(p.created_at)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-emerald-700 sm:px-5">
                    {formatCurrency(parseMoney(p.amount))}
                  </td>
                  <td className="px-3 py-3 text-slate-600 sm:px-5">
                    {p.previous_debt != null && p.new_debt != null
                      ? `${formatCurrency(parseMoney(p.previous_debt))} → ${formatCurrency(parseMoney(p.new_debt))}`
                      : '—'}
                  </td>
                  <td className="px-3 py-3 text-slate-600 sm:px-5">
                    {p.recorded_by_name || '—'}
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
