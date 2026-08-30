'use client';

import { useSearchParams } from 'next/navigation';
import { OrdersView } from '@/components/orders/OrdersView';
import type { OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = ['pending', 'assigned', 'in_progress', 'completed'];

export function OrdersPageClient() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');
  const courierId = searchParams.get('courier_id');
  const completedToday = searchParams.get('completedToday') === 'true';

  const parsedCustomer =
    customerId != null && Number.isFinite(Number(customerId)) && Number(customerId) > 0
      ? Number(customerId)
      : null;
  const parsedOrder =
    orderId != null && Number.isFinite(Number(orderId)) && Number(orderId) > 0
      ? Number(orderId)
      : null;

  const initialStatus = completedToday
    ? 'today_completed'
    : status && STATUSES.includes(status as OrderStatus)
      ? (status as OrderStatus)
      : '';

  const initialCourier =
    courierId === 'unassigned'
      ? 'unassigned'
      : courierId && Number.isFinite(Number(courierId))
        ? Number(courierId)
        : '';

  return (
    <OrdersView
      prefillCustomerId={parsedCustomer}
      openOrderId={parsedOrder}
      initialStatus={initialStatus}
      initialCourier={initialCourier}
    />
  );
}
