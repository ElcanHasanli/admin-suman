'use client';

import { useEffect, useState } from 'react';
import { Users, Package, CheckCircle, TrendingUp } from 'lucide-react';
import { getCustomers, getHistory, getOrders } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { StatCard, Card } from '@/components/ui/Card';

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
          revenue: history.summary.totalRevenue,
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
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">İdarə Paneli</h1>
        <p className="mt-1 text-slate-500">SuMan admin panelinə xoş gəldiniz</p>
      </div>

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
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        title="Bu gün gəlir"
        value={loading ? '...' : formatCurrency(stats.revenue)}
        icon={<TrendingUp size={20} />}
        accent="amber"
      />
    </div>
  );
}
