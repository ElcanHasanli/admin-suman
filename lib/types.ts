export type UserRole = 'admin' | 'courier';

export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed';

export type OrderType = 'delivery' | 'pickup';

export type WarehouseCode = 'mikrorayon' | 'xirdalan';

export type OrderExtraType = 'pump' | 'dispenser' | 'fine' | 'other';

export interface OrderExtra {
  type: OrderExtraType | string;
  label?: string;
  amount: number | string;
  quantity?: number;
  description?: string;
}

export interface OrderExtraPayload {
  type: OrderExtraType | string;
  amount: number;
  quantity?: number;
  description?: string;
}

export type HistoryPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'days2';

/** Günlük hesabat periodları */
export type DailyHistoryPeriod = 'today' | 'yesterday' | 'custom';

/** Aylıq hesabat period / shortcut */
export type MonthlyHistoryPeriod = 'custom' | 'week' | 'days2' | 'month';

export type HistoryReportTab = 'daily' | 'monthly';

export type ApiPeriod = 'today' | 'yesterday' | 'custom';

export interface OrdersListParams {
  status?: OrderStatus;
  courier_id?: number | 'unassigned';
  completedToday?: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  company_id?: number;
  company_name?: string;
}

export interface Customer {
  id: number;
  name: string;
  surname: string;
  display_name?: string;
  phone: string;
  phone2?: string | null;
  address: string;
  price: number | string;
  active_bidons: number;
  debt: number | string;
  /** Müştəridə saxlanan depozit (AZN) */
  deposit?: number | string;
  /** Müştərinin daimi qeydi (sifariş qeydlərindən ayrı) */
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerPayload {
  full_name?: string;
  name?: string;
  surname?: string;
  phone: string;
  phone2?: string;
  address: string;
  price: number;
  active_bidons: number;
  debt: number;
  deposit?: number;
  notes?: string | null;
}

export interface CustomersListParams {
  page?: number;
  limit?: number;
  /** Ad, telefon, ünvan üzrə axtarış */
  q?: string;
}

export interface CustomersListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface DebtPayment {
  id?: number;
  customer_id?: number;
  customer_name?: string;
  amount: number | string;
  previous_debt?: number | string;
  new_debt?: number | string;
  recorded_by_name?: string;
  created_at: string;
}

export type DepositEntryType = 'create' | 'adjust' | 'delete';

export interface DepositEntry {
  id?: number;
  customer_id?: number;
  customer?: string;
  customer_name?: string;
  amount: number | string;
  previous_deposit?: number | string;
  new_deposit?: number | string;
  entry_type: DepositEntryType | string;
  recorded_by_name?: string;
  created_at?: string;
}

export interface CustomerDepositTotals {
  current_total: number;
  customers_with_deposit: number;
}

export interface CustomerStats {
  total_orders: number;
  completed_orders: number;
  active_orders: number;
  last_order_at?: string | null;
  last_completed_at?: string | null;
  total_order_value?: number | string;
}

export interface CustomerDetailResponse {
  customer: Customer;
  stats: CustomerStats;
  recent_orders: Order[];
  debt_payments: DebtPayment[];
  deposit_entries?: DepositEntry[];
}

export interface UpdateCustomerResponse {
  customer: Customer;
  debt_payment?: DebtPayment | null;
  deposit_entry?: {
    amount: number;
    previous_deposit: number;
    new_deposit: number;
    entry_type: DepositEntryType | string;
  } | null;
}

export interface Courier {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
}

export type PaymentType = 'cash' | 'card' | 'credit';

export type OrderNoteAuthorRole = 'admin' | 'courier';

export interface OrderNote {
  id: number;
  body: string;
  author_role: OrderNoteAuthorRole;
  author_name?: string;
  created_at?: string;
}

export interface Order {
  id: number;
  customer_id?: number;
  courier_id?: number;
  order_type?: OrderType | string;
  scheduled_date?: string;
  name?: string;
  surname?: string;
  customer_name?: string;
  customer_surname?: string;
  customer_phone?: string;
  customer?: { name?: string; surname?: string; phone?: string; display_name?: string };
  courier_name?: string;
  bidons_count?: number;
  /** Tamamlamada müştəriyə verilən dolu bidon (tamamlanmamışda null) */
  full_bidons_given?: number | null;
  /** Tamamlamada müştəridən alınan boş bidon (tamamlanmamışda null) */
  empty_bidons_returned?: number | null;
  unit_price?: number | string;
  address?: string;
  price?: number | string;
  extras?: OrderExtra[];
  is_prepaid?: boolean;
  prepaid_amount?: number | string;
  status?: OrderStatus | string;
  /** V2: qeydlər massivi; köhnə API: tək sətir string */
  notes?: OrderNote[] | string;
  created_at?: string;
  assigned_at?: string;
  assigned_at_baku?: string;
  completed_at?: string;
  completed_at_baku?: string;
  payment_type?: PaymentType | string;
  amount_paid?: number | string;
  debt_paid_at_completion?: number | string;
  total_collected?: number | string;
  is_paid?: boolean;
  paid_at?: string | null;
  remaining_amount?: number | string;
  customer_debt?: number | string;
}

export interface MarkOrderPaidResponse {
  order: Order;
  debt_payment?: DebtPayment;
  customer_debt?: number;
  paid_amount?: number;
  order_remaining?: number;
}

export interface CustomerOrderPreviewNote {
  body: string;
  created_at?: string;
  author_role?: OrderNoteAuthorRole;
  author_name?: string;
}

export interface CustomerOrderPreviewResponse {
  customer: Customer;
  last_note: CustomerOrderPreviewNote | null;
}

export interface OrderPayload {
  customer_id: number;
  courier_id: number;
  order_type?: OrderType;
  scheduled_date?: string;
  bidons_count: number;
  unit_price?: number;
  address?: string;
  price?: number;
  extras?: OrderExtraPayload[];
  is_prepaid?: boolean;
  prepaid_amount?: number;
  notes?: string;
  debt?: number;
}

export type ExpenseCategory =
  | 'payroll'
  | 'fuel'
  | 'rent'
  | 'supplies'
  | 'equipment'
  | 'other';

export type ExpenseSource = 'admin' | 'courier';

export interface Expense {
  id: number;
  courier_id?: number | null;
  courier_name?: string;
  amount: number | string;
  description: string;
  category?: ExpenseCategory | string;
  source?: ExpenseSource | string;
  created_by?: string;
  created_at: string;
}

export interface ExpensePayload {
  courier_id?: number;
  amount: number;
  description: string;
  category?: ExpenseCategory | string;
  source?: ExpenseSource;
}

export interface HistoryDashboardSalesWater {
  unit_price: number;
  bidons: number;
  amount: number;
}

export interface HistoryDashboardSalesExtra {
  type: string;
  label: string;
  count: number;
  amount: number;
}

export interface HistoryDashboardSales {
  total: number;
  water_total: number;
  extras_total: number;
  water: HistoryDashboardSalesWater[];
  extras: HistoryDashboardSalesExtra[];
  by_courier?: { courier_id?: number; courier_name?: string; total?: number }[];
  orders?: Order[];
}

export interface HistoryDashboardDebtGiven {
  total: number;
  count: number;
  customers: {
    customer: string;
    customer_id?: number;
    amount: number;
    order_id: number | null;
    recorded_by_name?: string;
    recorded_by_role?: 'courier' | 'admin' | string;
  }[];
}

export interface HistoryDashboardAmountBox {
  total: number;
  count?: number;
  label?: string;
  /** Nisyə: ödənilməmiş sifarişlər; digər qutularda opsional siyahı */
  orders?: Order[];
  /** Nişə modalı — müştəri/sifariş sətirləri */
  customers?: HistoryDashboardCreditCustomer[];
  /** Xərc modalı — filterlənmiş siyahı */
  items?: Expense[];
}

export interface HistoryDashboardCreditCustomer {
  order_id: number;
  customer_id?: number;
  customer: string;
  amount: number | string;
  price?: number | string;
  amount_paid?: number | string;
  payment_type?: string;
  kind?: 'credit' | 'partial' | string;
  courier_name?: string;
  completed_at?: string;
}

export interface HistoryDashboardCourierBalance {
  total: number;
  formula?: {
    sales?: number;
    debt_given?: number;
    credit?: number;
    prepaid?: number;
    partial_unpaid?: number;
  };
}

/** Aylıq: satış − xərclər */
export interface HistoryDashboardNetIncome {
  total: number;
  sales?: number;
  expenses?: number;
  formula?: string;
  label?: string;
}

/** Bidon qutusu (ədəd — AZN deyil) */
export interface HistoryDashboardBidonItem {
  order_id: number;
  customer?: string;
  courier_id?: number;
  courier_name?: string;
  bidons: number;
  order_type?: string;
  completed_at?: string;
}

export interface HistoryDashboardBidonBox {
  total: number;
  count: number;
  unit?: string;
  label?: string;
  items: HistoryDashboardBidonItem[];
}

export interface HistoryDashboardDepositEntry {
  customer?: string;
  amount: number | string;
  entry_type: DepositEntryType | string;
  recorded_by_name?: string;
  created_at?: string;
}

/** Period üzrə depozit ledger qutusu */
export interface HistoryDashboardDepositsBox {
  total: number;
  entered: number;
  removed: number;
  net: number;
  count: number;
  /** İndi müştərilərdəki ümumi depozit (perioddan asılı deyil) */
  current_total: number;
  label?: string;
  entries: HistoryDashboardDepositEntry[];
}

export interface HistoryDashboard {
  sales: HistoryDashboardSales;
  debt_given: HistoryDashboardDebtGiven;
  credit: HistoryDashboardAmountBox;
  prepaid: HistoryDashboardAmountBox;
  courier_balance: HistoryDashboardCourierBalance;
  expenses: HistoryDashboardAmountBox;
  net_balance: HistoryDashboardAmountBox;
  /** Verilən dolu bidon */
  bidons_sold: HistoryDashboardBidonBox;
  /** Alınan boş bidon */
  bidons_taken: HistoryDashboardBidonBox;
  /** Depozit daxil/çıxış (ledger) */
  deposits: HistoryDashboardDepositsBox;
  /** Aylıq hesabat — xalis gəlir */
  net_income?: HistoryDashboardNetIncome | null;
}

/** Filter olmadan — hər kuryer üçün eyni qutular */
export interface HistoryDashboardByCourier {
  courier_id: number;
  courier_name?: string;
  dashboard: HistoryDashboard;
}

export interface HistoryQueryOptions {
  period?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  courierId?: number;
  expenseQ?: string;
}

export interface HistoryDashboardResponse {
  period: string;
  report?: string;
  startDate?: string;
  endDate?: string;
  expense_q?: string | null;
  dashboard: HistoryDashboard;
  couriers: Courier[];
  by_courier?: HistoryDashboardByCourier[];
}

export interface DebtorsListResponse {
  customers: Customer[];
  total: number;
  total_debt: number;
  page: number;
  limit: number;
}

export interface PayCustomerDebtResponse {
  customer_id: number;
  paid_amount: number;
  previous_debt: number;
  customer_debt: number;
  debt_payment: DebtPayment;
}

export interface HistorySummary {
  totalOrders: number;
  totalRevenue: number;
  orderRevenue?: number;
  salesRevenue?: number;
  debtCollected?: number;
  totalExpenses?: number;
  netRevenue?: number;
  cashRevenue: number;
  cardRevenue: number;
  creditRevenue: number;
  unpaidCreditOrders: number;
  unpaidCreditAmount: number;
}

export interface HistoryResponse {
  period: string;
  summary: HistorySummary;
  dashboard?: HistoryDashboard;
  by_courier?: HistoryDashboardByCourier[];
  orders: Order[];
  expenses?: Expense[];
  debtPayments?: DebtPayment[];
  depositEntries?: DepositEntry[];
  deposit_totals?: CustomerDepositTotals;
}

export type DateRangePreset = 'yesterday' | 'today' | 'custom';

export type ExpensePeriod = 'yesterday' | 'today' | 'custom';

export type WarehousePeriod = 'yesterday' | 'today' | 'custom';

export interface WarehouseStock {
  code?: WarehouseCode | string;
  warehouse_code?: WarehouseCode | string;
  name?: string;
  warehouse_name?: string;
  full_count: number;
  empty_count: number;
  pump_count?: number;
  dispenser_count?: number;
  updated_at?: string;
  updated_by_name?: string;
}

export interface WarehouseCustomersSummary {
  total_active_bidons: number;
  customer_count: number;
}

export interface WarehouseUpdate {
  id?: number;
  courier_id?: number;
  courier_name?: string;
  warehouse_code?: WarehouseCode | string;
  warehouse_name?: string;
  /** Köhnə API */
  empty_in: number;
  full_in: number;
  full_out: number;
  /** Yeni API */
  entry_full?: number;
  entry_empty?: number;
  exit_full?: number;
  /** Anbardan götürülən dolu (exit_full − entry_full) */
  full_taken?: number;
  previous_full?: number;
  previous_empty?: number;
  remaining_full: number;
  remaining_empty: number;
  notes?: string;
  created_at: string;
}

export interface WarehouseSummaryResponse {
  /** Köhnə tək anbar — geriyə uyğunluq */
  warehouse?: WarehouseStock;
  /** Mikrorayon + Xırdalan */
  warehouses?: WarehouseStock[];
  customers: WarehouseCustomersSummary;
  last_update?: WarehouseUpdate | null;
}

export interface WarehouseStockPayload {
  warehouse_code: WarehouseCode | string;
  full_count: number;
  empty_count: number;
  pump_count?: number;
  dispenser_count?: number;
  notes?: string;
}

export type NotificationType =
  | 'customer_inactive'
  | 'order_completed'
  | 'expense_created'
  | 'order_note'
  | 'warehouse_updated'
  | string;

export interface AdminNotification {
  id: number;
  type: NotificationType;
  message: string;
  customer_id?: number;
  order_id?: number;
  expense_id?: number;
  last_order_date?: string;
  screen?: string;
  read?: boolean;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
  data?: Record<string, string>;
}
