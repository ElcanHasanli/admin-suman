import type {
  Customer,
  CustomerPayload,
  DateRangePreset,
  HistorySummary,
  Order,
  OrderNote,
  WarehouseUpdate,
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

/** Xalis gəlir = satış gəliri − xərclər (borc ödənişləri daxil deyil) */
export function getNetRevenue(summary?: HistorySummary | null): number {
  if (!summary) return 0;
  return getOrderRevenue(summary) - getTotalExpenses(summary);
}

export function getDebtCollected(summary?: HistorySummary | null): number {
  return summary?.debtCollected ?? 0;
}

export function getTotalExpenses(summary?: HistorySummary | null): number {
  return summary?.totalExpenses ?? 0;
}

export function getOrderRevenue(summary?: HistorySummary | null): number {
  if (typeof summary?.orderRevenue === 'number') return summary.orderRevenue;
  if (typeof summary?.salesRevenue === 'number') return summary.salesRevenue;
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

export function truncateAddress(address: string, maxLen = 48): string {
  const t = address.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen).trim()}…`;
}

export function phoneToTel(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '#';
}

export function parseMoney(value: number | string | undefined): number {
  if (value == null) return 0;
  return typeof value === 'string' ? parseFloat(value) || 0 : value;
}

export function getCustomerPrice(customer: Customer): number {
  return parseMoney(customer.price);
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

export function getOrderAmountPaid(order: Order): number {
  if (order.amount_paid != null && order.amount_paid !== '') {
    return parseMoney(order.amount_paid);
  }
  return isOrderPaid(order) ? getOrderPrice(order) : 0;
}

export function getOrderRemainingAmount(order: Order): number {
  if (order.remaining_amount != null && order.remaining_amount !== '') {
    return parseMoney(order.remaining_amount);
  }
  if (isOrderPaid(order)) return 0;
  return Math.max(0, getOrderPrice(order) - getOrderAmountPaid(order));
}

export function getOrderCustomerDebt(order: Order): number | null {
  if (order.customer_debt == null || order.customer_debt === '') return null;
  return parseMoney(order.customer_debt);
}

export function canMarkOrderDebtPaid(order: Order): boolean {
  if (isOrderPaid(order)) return false;
  return getOrderRemainingAmount(order) > 0;
}

export function formatMarkPaidSuccessMessage(res: {
  paid_amount?: number;
  order_remaining?: number;
  customer_debt?: number;
}): string {
  const paid = formatCurrency(res.paid_amount ?? 0);
  const remaining = formatCurrency(res.order_remaining ?? 0);
  const debt =
    res.customer_debt != null ? formatCurrency(res.customer_debt) : '—';
  return `${paid} ödənildi. Sifarişdə qalan: ${remaining}. Müştəri borcu: ${debt}`;
}

export function calcUnpaidCreditFromOrders(orders: Order[]): {
  amount: number;
  count: number;
} {
  const unpaid = orders.filter((o) => !isOrderPaid(o));
  return {
    amount: unpaid.reduce((sum, o) => sum + getOrderRemainingAmount(o), 0),
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

/** YYYY-MM-DD təqvim tarixi — new Date() ilə parse etməyin (UTC sürüşməsi) */
export function formatCalendarDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const raw = dateStr.trim().slice(0, 10);
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return raw || '—';
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/** ISO vaxt (assigned_at_baku, completed_at_baku) — Baku timezone */
export function formatBakuDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 16);
  return d.toLocaleString('az-AZ', {
    timeZone: 'Asia/Baku',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBakuTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('az-AZ', {
    timeZone: 'Asia/Baku',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** İcra günü — scheduled_date (təqvim); fallback köhnə sifarişlər */
export function getOrderScheduledDateDisplay(order: Order): string {
  if (order.scheduled_date) return formatCalendarDate(order.scheduled_date);
  return formatCalendarDate(normalizeDate(order.completed_at || order.created_at));
}

export function getOrderAssignedTimeDisplay(order: Order): string {
  return formatBakuDateTime(order.assigned_at_baku || order.assigned_at);
}

export function getOrderCompletedTimeDisplay(order: Order): string {
  return formatBakuDateTime(order.completed_at_baku || order.completed_at);
}

/** @deprecated use getOrderScheduledDateDisplay */
export function getOrderDate(order: Order): string {
  return getOrderScheduledDateDisplay(order);
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

export function getDateRange(preset: 'yesterday' | 'today'): { from: string; to: string } {
  const now = new Date();
  if (preset === 'today') {
    const to = formatLocalDate(now);
    return { from: to, to };
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const d = formatLocalDate(yesterday);
  return { from: d, to: d };
}

export type ApiPeriod = 'today' | 'yesterday' | 'custom';

/** Backend period: today | yesterday | custom (+ startDate/endDate) — Asia/Baku server tərəfində */
export function resolveApiPeriodParams(
  preset: DateRangePreset,
  dateFrom: string,
  dateTo: string
): { period: ApiPeriod; startDate?: string; endDate?: string } {
  if (preset === 'today') return { period: 'today' };
  if (preset === 'yesterday') return { period: 'yesterday' };
  if (dateFrom && dateTo) {
    return { period: 'custom', startDate: dateFrom, endDate: dateTo };
  }
  return { period: 'today' };
}

/** Excel fayl adı üçün — today/yesterday-də API startDate/endDate göndərmir */
export function resolveExportFilenameDates(
  preset: DateRangePreset,
  dateFrom: string,
  dateTo: string
): { startDate: string; endDate: string } {
  if (dateFrom && dateTo) return { startDate: dateFrom, endDate: dateTo };
  const range = getDateRange(preset === 'yesterday' ? 'yesterday' : 'today');
  return { startDate: range.from, endDate: range.to };
}

/** @deprecated use resolveApiPeriodParams */
export const resolveHistoryDateParams = resolveApiPeriodParams;

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  payroll: 'Əmək haqqı / ödənişlər',
  fuel: 'Yanacaq, nəqliyyat',
  supplies: 'Materiallar, təchizat',
  rent: 'İcarə, kommunal',
  equipment: 'Avadanlıq, təmir',
  other: 'Digər xərc',
};

export function getExpenseCategoryLabel(category?: string): string {
  if (!category) return '—';
  return EXPENSE_CATEGORY_LABELS[category.toLowerCase()] ?? category;
}

export function isAdminExpense(expense: { source?: string; courier_id?: number | null }): boolean {
  const src = (expense.source || '').toLowerCase();
  if (src === 'admin') return true;
  if (src === 'courier') return false;
  return expense.courier_id == null;
}

export function getExpenseAuthorLabel(expense: {
  courier_name?: string;
  source?: string;
  category?: string;
  courier_id?: number | null;
}): string {
  if (isAdminExpense(expense)) return 'Admin';
  return expense.courier_name?.trim() || 'Kuryer';
}

export function sumExpenseAmounts(expenses: { amount: number | string }[]): number {
  return expenses.reduce((sum, e) => sum + parseExpenseAmount(e.amount), 0);
}

export function formatWarehouseUpdateSummary(u: WarehouseUpdate): string {
  const parts: string[] = [];
  if (u.empty_in) parts.push(`+${u.empty_in} boş`);
  if (u.full_in) parts.push(`+${u.full_in} dolu`);
  if (u.full_out) parts.push(`−${u.full_out} dolu`);
  const tail = `→ anbarda ${u.remaining_full} dolu, ${u.remaining_empty} boş`;
  return parts.length ? `${parts.join(', ')} ${tail}` : tail;
}

export function getOrderTypeLabel(type?: string): string {
  switch ((type || 'delivery').toLowerCase()) {
    case 'pickup':
      return 'Boş bidon götürmə';
    case 'delivery':
      return 'Çatdırılma';
    default:
      return type || 'Çatdırılma';
  }
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
