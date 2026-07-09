'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { CUSTOMERS_DEFAULT_PAGE_SIZE, getDebtors } from '@/lib/api';
import type { Customer } from '@/lib/types';
import {
  formatCurrency,
  getCustomerActiveBidons,
  getCustomerDebt,
  getCustomerName,
  getCustomerPhone,
} from '@/lib/utils';
import { CustomerPayDebtModal } from '@/components/customers/CustomerPayDebtModal';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { TableScroll } from '@/components/ui/TableScroll';
import { Toast, ToastType } from '@/components/ui/Toast';
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
import { Banknote } from 'lucide-react';

export function DebtorsView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [payCustomer, setPayCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDebtors({
        page,
        limit: CUSTOMERS_DEFAULT_PAGE_SIZE,
        q: debouncedSearch || undefined,
      });
      setCustomers(data.customers);
      setTotal(data.total);
      setTotalDebt(data.total_debt);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Siyahı yüklənə bilmədi',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / CUSTOMERS_DEFAULT_PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard
          title="Borclu müştəri"
          value={loading ? '...' : total}
          icon={<Banknote size={20} />}
          accent="amber"
        />
        <StatCard
          title="Ümumi borc"
          value={loading ? '...' : formatCurrency(totalDebt)}
          icon={<Banknote size={20} />}
          accent="rose"
        />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ad və ya telefon axtar..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <Card className="overflow-hidden">
        <MobileOnly>
          <div className="p-3">
            {loading ? (
              <MobileEmpty>Yüklənir...</MobileEmpty>
            ) : customers.length === 0 ? (
              <MobileEmpty>Borclu müştəri tapılmadı</MobileEmpty>
            ) : (
              <MobileCardList>
                {customers.map((c) => (
                  <MobileCard key={c.id}>
                    <MobileCardTitle>{getCustomerName(c)}</MobileCardTitle>
                    <MobileCardGrid>
                      <MobileCardField label="Telefon" value={getCustomerPhone(c)} />
                      <MobileCardField label="Borc" value={formatCurrency(getCustomerDebt(c))} valueClassName="text-red-600 font-semibold" />
                      <MobileCardField label="Aktiv bidon" value={getCustomerActiveBidons(c)} />
                    </MobileCardGrid>
                    <MobileCardActions>
                      <Button
                        type="button"
                        variant="success"
                        onClick={() => setPayCustomer(c)}
                        className="w-full text-xs"
                      >
                        Borc ödə
                      </Button>
                    </MobileCardActions>
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
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Müştəri</th>
                  <th className="px-5 py-3">Telefon</th>
                  <th className="px-5 py-3">Aktiv bidon</th>
                  <th className="px-5 py-3">Borc</th>
                  <th className="px-5 py-3 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                      Yüklənir...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                      Borclu müştəri tapılmadı
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-medium">{getCustomerName(c)}</td>
                      <td className="px-5 py-3.5 text-slate-600">{getCustomerPhone(c)}</td>
                      <td className="px-5 py-3.5">{getCustomerActiveBidons(c)}</td>
                      <td className="px-5 py-3.5 font-semibold text-red-600">
                        {formatCurrency(getCustomerDebt(c))}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="success"
                          onClick={() => setPayCustomer(c)}
                          className="text-xs"
                        >
                          Borc ödə
                        </Button>
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

      <CustomerPayDebtModal
        open={!!payCustomer}
        customer={payCustomer}
        onClose={() => setPayCustomer(null)}
        onSuccess={(message) => {
          setPayCustomer(null);
          setToast({ message, type: 'success' });
          void load();
        }}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
