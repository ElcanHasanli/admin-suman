'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Package, CheckCircle, TrendingUp, Droplets } from 'lucide-react';
import { getCustomers, getHistory, getOrders, getWarehouseSummary } from '@/lib/api';
import { formatCurrency, getNetRevenue, getWarehouseName, normalizeWarehousesList } from '@/lib/utils';
import type { WarehouseStock } from '@/lib/types';
import { StatCard, Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    customers: 0,
    orders: 0,
    todayCompleted: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [historyWarning, setHistoryWarning] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseStock[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setHistoryWarning(null);

      const next = {
        customers: 0,
        orders: 0,
        todayCompleted: 0,
        revenue: 0,
      };

      const [customersRes, ordersRes, historyRes, warehouseRes] = await Promise.allSettled([
        getCustomers({ page: 1, limit: 1 }),
        getOrders(),
        getHistory('today'),
        getWarehouseSummary(),
      ]);

      if (customersRes.status === 'fulfilled') {
        next.customers = customersRes.value.total;
      }

      if (ordersRes.status === 'fulfilled') {
        next.orders = ordersRes.value.length;
      }

      if (historyRes.status === 'fulfilled') {
        next.todayCompleted = historyRes.value.summary?.totalOrders ?? 0;
        next.revenue = getNetRevenue(historyRes.value.summary);
      } else {
        const err = historyRes.reason;
        const msg =
          err instanceof Error ? err.message : 'Tarixçə statistikası yüklənə bilmədi';
        if (msg.toLowerCase().includes('debt_payments')) {
          setHistoryWarning(
            'Tarixçə: backend V2 migrasiya lazımdır (serverdə npm run db:migrate:v2). Müştəri və sifariş sayları normal göstərilir.'
          );
        } else {
          setHistoryWarning(`Tarixçə: ${msg}`);
        }
      }

      if (warehouseRes.status === 'fulfilled') {
        setWarehouses(normalizeWarehousesList(warehouseRes.value));
      }

      setStats(next);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="İdarə Paneli"
        description="SuMan admin panelinə xoş gəldiniz"
      />

      {historyWarning && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {historyWarning}
        </p>
      )}

      <StatsGrid loading={loading} stats={stats} />

      {warehouses.length > 0 && (
        <Link href="/dashboard/warehouse">
          <Card className="flex items-center justify-between gap-4 p-4 transition hover:ring-2 hover:ring-sky-200 sm:p-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">Su doldurma anbarı</p>
              <div className="mt-1 space-y-0.5">
                {warehouses.map((w) => (
                  <p key={w.warehouse_code || w.code || getWarehouseName(w)} className="text-sm font-semibold text-slate-900 sm:text-base">
                    {getWarehouseName(w)}:{' '}
                    <span className="font-bold">
                      {w.full_count} dolu · {w.empty_count} boş
                    </span>
                  </p>
                ))}
              </div>
              <p className="mt-1 text-xs text-sky-600">Anbar səhifəsinə keç →</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
              <Droplets size={24} />
            </div>
          </Card>
        </Link>
      )}
    </div>
  );
}

function StatsGrid({
  loading,
  stats,
}: {
  loading: boolean;
  stats: { customers: number; orders: number; todayCompleted: number; revenue: number };
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        title="Müştərilər"
        value={loading ? '...' : stats.customers}
        icon={<Users size={20} />}
        accent="sky"
      />
      <StatCard
        title="Sifarişlər"
        value={loading ? '...' : stats.orders}
        icon={<Package size={20} />}
        accent="violet"
      />
      <StatCard
        title="Bu gün tamamlanan"
        value={loading ? '...' : stats.todayCompleted}
        icon={<CheckCircle size={20} />}
        accent="emerald"
      />
      <StatCard
        title="Bu gün xalis gəlir"
        value={loading ? '...' : formatCurrency(stats.revenue)}
        icon={<TrendingUp size={20} />}
        accent="amber"
      />
    </div>
  );
}
