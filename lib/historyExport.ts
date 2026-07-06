import type { HistoryResponse } from './types';
import {
  formatDateTime,
  getDebtCollected,
  getExpenseAuthorLabel,
  getExpenseCategoryLabel,
  getNetRevenue,
  getOrderAmountPaid,
  getOrderBidonCount,
  getOrderCompletedTimeDisplay,
  getOrderCourierName,
  getOrderCustomerName,
  getOrderScheduledDateDisplay,
  getOrderPaidLabel,
  getOrderPrice,
  getOrderRemainingAmount,
  getOrderRevenue,
  getOrderStatusLabel,
  getPaymentTypeLabel,
  getTotalExpenses,
  parseExpenseAmount,
  parseMoney,
} from './utils';

const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function buildHistoryExcelBlob(
  data: HistoryResponse,
  rangeLabel: string
): Promise<Blob> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const { summary, orders, expenses = [], debtPayments = [] } = data;

  const summaryRows: (string | number)[][] = [
    ['Tarix aralığı', rangeLabel],
    [],
    ['Göstərici', 'Dəyər'],
    ['Sifariş sayı', summary.totalOrders],
    ['Sifariş gəliri', getOrderRevenue(summary)],
    ['Borc ödənişləri', getDebtCollected(summary)],
    ['Ümumi daxilolma', getOrderRevenue(summary) + getDebtCollected(summary)],
    ['Nağd gəlir', summary.cashRevenue],
    ['Kart gəlir', summary.cardRevenue],
    ['Nisyə gəlir', summary.creditRevenue],
    ['Xərclər', getTotalExpenses(summary)],
    ['Xalis gəlir', getNetRevenue(summary)],
    ['Ödənilməmiş nisyə (say)', summary.unpaidCreditOrders],
    ['Ödənilməmiş nisyə (məbləğ)', summary.unpaidCreditAmount],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Xülasə');

  const orderHeaders = [
    'ID',
    'Müştəri',
    'Kuryer',
    'Bidon',
    'Qiymət',
    'Ödənilib',
    'Qalan',
    'Ödəniş növü',
    'Status',
    'Ödəndi',
    'İcra günü',
    'Tamamlanma',
  ];
  const orderRows = orders.map((o) => [
    o.id,
    getOrderCustomerName(o),
    getOrderCourierName(o),
    getOrderBidonCount(o),
    getOrderPrice(o),
    getOrderAmountPaid(o),
    getOrderRemainingAmount(o),
    getPaymentTypeLabel(o.payment_type),
    getOrderStatusLabel(o.status),
    getOrderPaidLabel(o),
    getOrderScheduledDateDisplay(o),
    getOrderCompletedTimeDisplay(o),
  ]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows]),
    'Sifarişlər'
  );

  const expenseHeaders = ['ID', 'Mənbə', 'Məbləğ', 'Təsvir', 'Kateqoriya', 'Tarix'];
  const expenseRows = expenses.map((e) => [
    e.id,
    getExpenseAuthorLabel(e),
    parseExpenseAmount(e.amount),
    e.description,
    getExpenseCategoryLabel(e.category),
    formatDateTime(e.created_at),
  ]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows]),
    'Xərclər'
  );

  const debtHeaders = [
    'ID',
    'Müştəri',
    'Ödənilən',
    'Əvvəlki borc',
    'Yeni borc',
    'Qeyd edən',
    'Tarix',
  ];
  const debtRows = debtPayments.map((p) => [
    p.id ?? '',
    p.customer_name || '—',
    parseMoney(p.amount),
    p.previous_debt != null ? parseMoney(p.previous_debt) : '',
    p.new_debt != null ? parseMoney(p.new_debt) : '',
    p.recorded_by_name || '—',
    formatDateTime(p.created_at),
  ]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([debtHeaders, ...debtRows]),
    'Borc ödənişləri'
  );

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: EXCEL_MIME });
}
