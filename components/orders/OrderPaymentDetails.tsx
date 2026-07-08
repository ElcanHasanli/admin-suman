'use client';

import type { Order } from '@/lib/types';
import {
  formatCurrency,
  formatOrderCollectionSummary,
  getOrderAmountPaid,
  getOrderCustomerDebt,
  getOrderDebtPaidAtCompletion,
  getOrderPrice,
  getOrderRemainingAmount,
  getOrderTotalCollected,
} from '@/lib/utils';

export function OrderCollectionSummary({ order }: { order: Order }) {
  const summary = formatOrderCollectionSummary(order);
  if (!summary) return null;

  return <p className="text-xs text-slate-600">Yığılan: {summary}</p>;
}

export function OrderPaymentBreakdown({
  order,
  compact,
}: {
  order: Order;
  compact?: boolean;
}) {
  const price = getOrderPrice(order);
  const orderPaid = getOrderAmountPaid(order);
  const debtAtCompletion = getOrderDebtPaidAtCompletion(order);
  const totalCollected = getOrderTotalCollected(order);
  const remaining = getOrderRemainingAmount(order);
  const customerDebt = getOrderCustomerDebt(order);

  if (compact) {
    return (
      <div className="space-y-0.5 text-xs">
        <p className="font-medium text-slate-900">{formatCurrency(price)}</p>
        <OrderCollectionSummary order={order} />
        {!orderPaid && remaining <= 0 ? null : (
          <p className="text-slate-500">
            Sifarişə: {formatCurrency(orderPaid)}
            {remaining > 0 && (
              <span className="font-medium text-red-600"> · Qalan: {formatCurrency(remaining)}</span>
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
        <Stat label="Qiymət" value={formatCurrency(price)} />
        <Stat label="Sifarişə ödənilib" value={formatCurrency(orderPaid)} valueClass="text-emerald-700" />
        <Stat
          label="Sifariş qalığı"
          value={formatCurrency(remaining)}
          valueClass={remaining > 0 ? 'text-red-600' : 'text-emerald-700'}
        />
        {debtAtCompletion > 0 && (
          <Stat label="Tamamlamada borc" value={formatCurrency(debtAtCompletion)} />
        )}
        {totalCollected > 0 && (
          <Stat label="Kuryer yığıb" value={formatCurrency(totalCollected)} />
        )}
        {customerDebt != null && (
          <Stat
            label="Müştəri borcu"
            value={formatCurrency(customerDebt)}
            valueClass={customerDebt > 0 ? 'text-red-600' : 'text-slate-800'}
          />
        )}
      </div>
      {debtAtCompletion > 0 && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900 ring-1 ring-sky-100">
          {formatOrderCollectionSummary(order)}
        </p>
      )}
      {remaining > 0 && (
        <p className="text-xs text-slate-500">
          Admin ödənişi yalnız sifariş qalığına ({formatCurrency(remaining)}) tətbiq olunur.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = 'text-slate-900',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg bg-white p-2 ring-1 ring-slate-100">
      <p className="text-slate-400">{label}</p>
      <p className={`mt-0.5 font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
