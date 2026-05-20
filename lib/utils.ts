import type { Customer, Order } from './types';

export function formatCurrency(amount: number | string | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
  return `₼${num.toFixed(2)}`;
}

export function getCustomerName(customer: Customer): string {
  return `${customer.name || ''} ${customer.surname || ''}`.trim() || 'Naməlum';
}

export function getCustomerPhone(customer: Customer): string {
  return customer.phone || '';
}

export function getCustomerPrice(customer: Customer): number {
  return customer.price ?? 0;
}

export function getCustomerActiveBidons(customer: Customer): number {
  return customer.active_bidons ?? 0;
}

export function getCustomerDebt(customer: Customer): number {
  const debt = customer.debt ?? 0;
  return typeof debt === 'string' ? parseFloat(debt) : debt;
}

export function getOrderCustomerName(order: Order): string {
  if (order.customer_name || order.customer_surname) {
    return `${order.customer_name || ''} ${order.customer_surname || ''}`.trim();
  }
  if (order.name || order.surname) {
    return `${order.name || ''} ${order.surname || ''}`.trim();
  }
  if (order.customer) {
    return `${order.customer.name || ''} ${order.customer.surname || ''}`.trim();
  }
  return '—';
}

export function isOrderCreditPayment(order: Order): boolean {
  return (order.payment_type || '').toLowerCase() === 'credit';
}

export function isOrderPaid(order: Order): boolean {
  if (typeof order.is_paid === 'boolean') return order.is_paid;
  return !isOrderCreditPayment(order);
}

export function getOrderPaidLabel(order: Order): 'Ödənilib' | 'Borc' {
  return isOrderPaid(order) ? 'Ödənilib' : 'Borc';
}

export function getOrderPrice(order: Order): number {
  const price = order.price;
  return typeof price === 'string' ? parseFloat(price) || 0 : price ?? 0;
}

export function calcUnpaidCreditFromOrders(orders: Order[]): {
  amount: number;
  count: number;
} {
  const unpaid = orders.filter((o) => !isOrderPaid(o));
  return {
    amount: unpaid.reduce((sum, o) => sum + getOrderPrice(o), 0),
    count: unpaid.length,
  };
}

export function getPaymentTypeLabel(paymentType?: string): string {
  switch ((paymentType || '').toLowerCase()) {
    case 'cash':
      return 'Nağd';
    case 'card':
      return 'Kart';
    case 'credit':
      return 'Nisyə';
    default:
      return '—';
  }
}

/** Nisyə sifarişində yalnız ödənilmişdirsə gəlir sayılır; əks halda 0 (borc). */
export function getOrderCreditRevenueAmount(order: Order): number {
  if (!isOrderCreditPayment(order) || !isOrderPaid(order)) return 0;
  return getOrderPrice(order);
}

export function calcPaidCreditRevenueFromOrders(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + getOrderCreditRevenueAmount(o), 0);
}

export function getCreditRevenue(
  orders: Order[],
  summary?: { creditRevenue?: number } | null
): number {
  if (summary && typeof summary.creditRevenue === 'number') {
    return summary.creditRevenue;
  }
  return calcPaidCreditRevenueFromOrders(orders);
}

export function getUnpaidCreditDebt(
  orders: Order[],
  summary?: { unpaidCreditAmount?: number; unpaidCreditOrders?: number } | null
): { amount: number; count: number } {
  if (summary && typeof summary.unpaidCreditAmount === 'number') {
    return {
      amount: summary.unpaidCreditAmount,
      count: summary.unpaidCreditOrders ?? 0,
    };
  }
  return calcUnpaidCreditFromOrders(orders);
}

export function formatPaidAt(paidAt?: string | null): string {
  if (!paidAt) return '';
  const date = new Date(paidAt);
  if (isNaN(date.getTime())) return paidAt.slice(0, 10);
  return date.toLocaleDateString('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getOrderCourierName(order: Order): string {
  return order.courier_name || '—';
}

export function getOrderBidonCount(order: Order): number {
  return order.bidons_count ?? 0;
}

export function getOrderStatus(order: Order): string {
  return (order.status || '').toLowerCase();
}

export function isOrderCompleted(order: Order): boolean {
  return getOrderStatus(order) === 'completed';
}

export function isOrderPending(order: Order): boolean {
  const s = getOrderStatus(order);
  return s === 'pending' || s === 'assigned' || s === 'in_progress';
}

export function normalizeDate(dateString?: string): string {
  if (!dateString) return '';
  return dateString.slice(0, 10);
}

export function getOrderDate(order: Order): string {
  return normalizeDate(order.completed_at || order.created_at);
}

export function isDateInRange(dateStr: string | undefined, from: string, to: string): boolean {
  const normalized = normalizeDate(dateStr);
  if (!normalized) return false;
  return normalized >= from && normalized <= to;
}

export function getDateRange(preset: 'today' | 'week' | 'month'): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];

  if (preset === 'today') {
    return { from: to, to };
  }

  if (preset === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    return { from: start.toISOString().split('T')[0], to };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: start.toISOString().split('T')[0], to };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function normalizePhone(phone: string): string {
  let p = phone.trim();
  if (!/^\+?\d{9,14}$/.test(p)) return p;
  if (!p.startsWith('+994')) {
    if (p.startsWith('0')) p = '+994' + p.slice(1);
    else if (!p.startsWith('+')) p = '+994' + p;
  }
  return p;
}

export function getOrderStatusLabel(status?: string): string {
  switch ((status || '').toLowerCase()) {
    case 'completed':
      return 'Tamamlandı';
    case 'in_progress':
      return 'Çatdırılır';
    case 'assigned':
      return 'Təyin edildi';
    case 'pending':
      return 'Gözləyir';
    default:
      return status || 'Gözləyir';
  }
}

export function getCourierName(courier: { name?: string; email?: string }): string {
  return courier.name || courier.email || '—';
}
