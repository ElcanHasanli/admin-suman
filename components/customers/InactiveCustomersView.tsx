'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserX, ChevronRight } from 'lucide-react';
import {
  getInactiveCustomers,
  INACTIVE_CUSTOMERS_DEFAULT_PAGE_SIZE,
} from '@/lib/api';
import type { InactiveCustomer } from '@/lib/types';
import {
  formatCurrency,
  formatDateTime,
  getCustomerActiveBidons,
  getCustomerDebt,
  getCustomerName,
  getCustomerPhone,
  resolveInactiveCustomersParams,
  truncateAddress,
} from '@/lib/utils';
import {
  InactivePeriodButtons,
  useInactivePeriodState,
} from '@/components/history/HistoryPeriodPresets';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { TableScroll } from '@/components/ui/TableScroll';
import { Toast, ToastType } from '@/components/ui/Toast';
import { MobileOnly, DesktopOnly } from '@/components/ui/ResponsiveViews';
import {
  MobileCard,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
  MobileCardTitle,
  MobileEmpty,
} from '@/components/ui/MobileCards';

function formatLastOrder(c: InactiveCustomer): string {
  if (c.last_order_date) return c.last_order_date;
  if (c.last_order_at) return formatDateTime(c.last_order_at).slice(0, 10);
  return '—';
}

export function InactiveCustomersView() {
  const router = useRouter();
  const period = useInactivePeriodState('month');
  const [customers, setCustomers] = useState<InactiveCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [rangeLabel, setRangeLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [daysInput, setDaysInput] = useState(String(period.days));
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, period.preset, period.dateFrom, period.dateTo, period.days]);

  useEffect(() => {
    setDaysInput(String(period.days));
  }, [period.days]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resolved = resolveInactiveCustomersParams(
        period.preset,
        period.dateFrom,
        period.dateTo,
        period.days
      );
      const data = await getInactiveCustomers({
        ...resolved,
        page,
        limit: INACTIVE_CUSTOMERS_DEFAULT_PAGE_SIZE,
        q: debouncedSearch || undefined,
      });
      setCustomers(data.customers ?? []);
      setTotal(data.total ?? 0);
      if (data.startDate && data.endDate) {
        setRangeLabel(
          data.startDate === data.endDate
            ? data.startDate
            : `${data.startDate} — ${data.endDate}`
        );
      } else if (data.days) {
        setRangeLabel(`Son ${data.days} gün`);
      } else {
        setRangeLabel(data.period || '');
      }
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Siyahı yüklənə bilmədi',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    period.preset,
    period.dateFrom,
    period.dateTo,
    period.days,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / INACTIVE_CUSTOMERS_DEFAULT_PAGE_SIZE));

  const openDetail = (id: number) => {
    router.push(`/dashboard/customers/detail/?id=${id}`);
  };

  const applyDays = () => {
    const n = Math.max(1, Math.floor(Number(daysInput) || 0));
    if (!n) {
      setToast({ message: 'Gün sayı düzgün deyil', type: 'error' });
      return;
    }
    period.setDays(n);
    setDaysInput(String(n));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:max-w-xs">
        <StatCard
          title="Passiv müştəri"
          value={loading ? '...' : total}
          subtitle={loading ? undefined : rangeLabel || undefined}
          icon={<UserX size={20} />}
          accent="amber"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <InactivePeriodButtons preset={period.preset} onPresetChange={period.setPreset} />
        <div className="relative w-full sm:ml-auto sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, telefon və ya ünvan axtar..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      {period.preset === 'custom' && (
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
            <Input
              label="Başlanğıc tarixi"
              type="date"
              value={period.dateFrom}
              onChange={(e) => period.setDateFrom(e.target.value)}
            />
            <Input
              label="Son tarix"
              type="date"
              value={period.dateTo}
              onChange={(e) => period.setDateTo(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={() => void load()} className="w-full sm:w-auto">
              Tətbiq et
            </Button>
          </div>
        </Card>
      )}

      {period.preset === 'days' && (
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex-1 sm:max-w-xs">
              <Input
                label="Son N gün"
                type="number"
                min={1}
                value={daysInput}
                onChange={(e) => setDaysInput(e.target.value)}
              />
            </div>
            <Button type="button" variant="secondary" onClick={applyDays} className="w-full sm:w-auto">
              Tətbiq et
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Bu günlərdə sifariş verməyən və qalıq bidonu olan müştərilər.
          </p>
        </Card>
      )}

      <Card className="overflow-hidden">
        <MobileOnly>
          <div className="p-3">
            {loading ? (
              <MobileEmpty>Yüklənir...</MobileEmpty>
            ) : customers.length === 0 ? (
              <MobileEmpty>Passiv müştəri tapılmadı</MobileEmpty>
            ) : (
              <MobileCardList>
                {customers.map((c) => (
                  <MobileCard key={c.id} onClick={() => openDetail(c.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <MobileCardTitle>{getCustomerName(c)}</MobileCardTitle>
                      <ChevronRight size={18} className="mt-0.5 shrink-0 text-slate-400" />
                    </div>
                    <MobileCardGrid>
                      <MobileCardField label="Telefon" value={getCustomerPhone(c)} />
                      <MobileCardField
                        label="Qalıq bidon"
                        value={getCustomerActiveBidons(c)}
                        valueClassName="font-semibold text-amber-700"
                      />
                      <MobileCardField label="Son sifariş" value={formatLastOrder(c)} />
                      <MobileCardField
                        label="Borc"
                        value={formatCurrency(getCustomerDebt(c))}
                        valueClassName={
                          getCustomerDebt(c) > 0 ? 'text-red-600 font-semibold' : undefined
                        }
                      />
                    </MobileCardGrid>
                    {c.address ? (
                      <p className="mt-2 text-xs text-slate-500">{truncateAddress(c.address)}</p>
                    ) : null}
                  </MobileCard>
                ))}
              </MobileCardList>
            )}
          </div>
        </MobileOnly>

        <DesktopOnly>
          <TableScroll minWidth={720}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Müştəri</th>
                  <th className="px-5 py-3">Telefon</th>
                  <th className="px-5 py-3">Qalıq bidon</th>
                  <th className="px-5 py-3">Son sifariş</th>
                  <th className="px-5 py-3">Borc</th>
                  <th className="px-5 py-3">Ünvan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      Yüklənir...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      Passiv müştəri tapılmadı
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/50"
                      onClick={() => openDetail(c.id)}
                    >
                      <td className="px-5 py-3.5 font-medium">{getCustomerName(c)}</td>
                      <td className="px-5 py-3.5 text-slate-600">{getCustomerPhone(c)}</td>
                      <td className="px-5 py-3.5 font-semibold text-amber-700">
                        {getCustomerActiveBidons(c)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{formatLastOrder(c)}</td>
                      <td
                        className={`px-5 py-3.5 ${
                          getCustomerDebt(c) > 0 ? 'font-semibold text-red-600' : 'text-slate-600'
                        }`}
                      >
                        {formatCurrency(getCustomerDebt(c))}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {c.address ? truncateAddress(c.address) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableScroll>
        </DesktopOnly>
      </Card>

      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`min-h-[36px] min-w-[36px] rounded-lg px-3 text-sm font-medium ${
                p === page
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
