import type {
  Customer,
  CustomerPayload,
  DateRangePreset,
  HistorySummary,
  Order,
  OrderNote,
} from './types';

export function formatCurrency(amount: number | string | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
  return `₼${num.toFixed(2)}`;
}

export function getCustomerName(customer: Customer): string {
  if (customer.display_name?.trim()) return customer.display_name.trim();
  return `${customer.name || ''} ${customer.surname || ''}`.trim() || 'Naməlum';
}

export function getCustomerPhone(customer: Customer): string {
  return customer.phone || '';
}

export function getCustomerPhone2(customer: Customer): string {
  return customer.phone2?.trim() || '';
}

/** Cədvəl üçün: əsas telefon (+ ikinci, varsa) */
export function formatCustomerPhones(customer: Customer): string {
  const p = getCustomerPhone(customer);
  const p2 = getCustomerPhone2(customer);
  return p2 ? `${p} · ${p2}` : p;
}

export function buildCustomerPayload(form: {
  fullName: string;
  phone: string;
  phone2: string;
  address: string;
  price: number;
  activeBidons: number;
  debt: number;
}): CustomerPayload {
  const payload: CustomerPayload = {
    full_name: form.fullName.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    price: form.price,
    active_bidons: form.activeBidons,
    debt: form.debt,
  };
  const p2 = form.phone2.trim();
  if (p2) payload.phone2 = p2;
  return payload;
}

export function customerToFormFields(c: Customer) {
  return {
    fullName: getCustomerName(c),
    phone: getCustomerPhone(c),
    phone2: getCustomerPhone2(c),
    address: c.address || '',
    price: String(getCustomerPrice(c) || ''),
    activeBidons: String(getCustomerActiveBidons(c)),
    debt: String(getCustomerDebt(c)),
  };
}

export function getOrderNotesList(order: Order): OrderNote[] {
  if (Array.isArray(order.notes)) return order.notes;
  return [];
}

export function getLegacyOrderNoteText(order: Order): string {
  if (typeof order.notes === 'string') return order.notes;
  return '';
}

export function getNetRevenue(summary?: HistorySummary | null): number {
  if (!summary) return 0;
  if (typeof summary.netRevenue === 'number') return summary.netRevenue;
  return summary.totalRevenue ?? 0;
}

export function getDebtCollected(summary?: HistorySummary | null): number {
  return summary?.debtCollected ?? 0;
}

export function getTotalExpenses(summary?: HistorySummary | null): number {
  return summary?.totalExpenses ?? 0;
}

export function getOrderRevenue(summary?: HistorySummary | null): number {
  if (typeof summary?.orderRevenue === 'number') return summary.orderRevenue;
  return summary?.totalRevenue ?? 0;
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 16);
  return d.toLocaleString('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getNoteAuthorLabel(role: string): string {
  return role === 'admin' ? 'Admin' : 'Kuryer';
}

export function parseExpenseAmount(amount: number | string): number {
  return typeof amount === 'string' ? parseFloat(amount) || 0 : amount ?? 0;
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
  if (order.customer?.display_name?.trim()) return order.customer.display_name.trim();
  if (order.customer_name || order.customer_surname) {
    return `${order.customer_name || ''} ${order.customer_surname || ''}`.trim();
  }
  if (order.name || order.surname) {
    return `${order.name || ''} ${order.surname || ''}`.trim();
  }
  if (order.customer) {
    const dn = (order.customer as { display_name?: string }).display_name;
    if (dn?.trim()) return dn.trim();
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

/** YYYY-MM-DD — cihazın yerli tarixi (toISOString UTC səhvi olmur) */
export function formatLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDateRange(preset: 'today' | 'week' | 'month'): { from: string; to: string } {
  const now = new Date();
  const to = formatLocalDate(now);

  if (preset === 'today') {
    return { from: to, to };
  }

  if (preset === 'week') {
    const start = new Date(now);
    const dow = now.getDay();
    const daysFromMonday = dow === 0 ? 6 : dow - 1;
    start.setDate(now.getDate() - daysFromMonday);
    return { from: formatLocalDate(start), to };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: formatLocalDate(start), to };
}

/** API-yə həmişə yerli tarix aralığı göndər (server UTC «bu gün» səhvi olmasın) */
export function resolveHistoryDateParams(
  preset: DateRangePreset,
  dateFrom: string,
  dateTo: string
): { period: 'custom'; startDate: string; endDate: string } {
  if (preset === 'custom' && dateFrom && dateTo) {
    return { period: 'custom', startDate: dateFrom, endDate: dateTo };
  }
  const range = getDateRange(preset === 'custom' ? 'today' : preset);
  return { period: 'custom', startDate: range.from, endDate: range.to };
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
