'use client';

import { useEffect, useState } from 'react';
import { Users, Package, CheckCircle, TrendingUp } from 'lucide-react';
import { getCustomers, getHistory, getOrders } from '@/lib/api';
import { formatCurrency, getDateRange, getNetRevenue } from '@/lib/utils';
import { StatCard } from '@/components/ui/Card';
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

      const todayRange = getDateRange('today');
      const [customersRes, ordersRes, historyRes] = await Promise.allSettled([
        getCustomers(),
        getOrders(),
        getHistory('custom', todayRange.from, todayRange.to),
      ]);

      if (customersRes.status === 'fulfilled') {
        next.customers = customersRes.value.length;
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
