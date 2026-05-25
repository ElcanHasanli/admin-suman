'use client';

import { useEffect, useState } from 'react';
import { Users, Package, CheckCircle, TrendingUp } from 'lucide-react';
import { getCustomers, getHistory, getOrders } from '@/lib/api';
import { formatCurrency, getNetRevenue } from '@/lib/utils';
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

  useEffect(() => {
    const load = async () => {
      try {
        const [customers, orders, history] = await Promise.all([
          getCustomers(),
          getOrders(),
          getHistory('today'),
        ]);

        setStats({
          customers: customers.length,
          orders: orders.length,
          todayCompleted: history.summary.totalOrders,
          revenue: getNetRevenue(history.summary),
        });
      } catch {
        /* keep zeros */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="İdarə Paneli"
        description="SuMan admin panelinə xoş gəldiniz"
      />
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
