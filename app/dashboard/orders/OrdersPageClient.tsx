'use client';

import { useSearchParams } from 'next/navigation';
import { OrdersView } from '@/components/orders/OrdersView';

export function OrdersPageClient() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const orderId = searchParams.get('order_id');

  const parsedCustomer =
    customerId != null && Number.isFinite(Number(customerId)) && Number(customerId) > 0
      ? Number(customerId)
      : null;
  const parsedOrder =
    orderId != null && Number.isFinite(Number(orderId)) && Number(orderId) > 0
      ? Number(orderId)
      : null;

  return (
    <OrdersView prefillCustomerId={parsedCustomer} openOrderId={parsedOrder} />
  );
}
