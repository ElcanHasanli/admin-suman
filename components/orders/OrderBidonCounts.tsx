'use client';

import type { Order } from '@/lib/types';
import { getOrderBidonBreakdown } from '@/lib/utils';

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums leading-none text-slate-900 sm:text-3xl">
        {value == null ? '—' : value}
      </p>
    </div>
  );
}

export function OrderBidonCounts({
  order,
  className = '',
}: {
  order: Order;
  className?: string;
}) {
  const { ordered, emptyTaken, remaining } = getOrderBidonBreakdown(order);
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      <Stat label="Sifariş" value={ordered} />
      <Stat label="Boş" value={emptyTaken} />
      <Stat label="Var" value={remaining} />
    </div>
  );
}
