export type UserRole = 'admin' | 'courier';

export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed';

export type OrderType = 'delivery' | 'pickup';

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
}

export interface UpdateCustomerResponse {
  customer: Customer;
  debt_payment?: DebtPayment | null;
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
  address?: string;
  price?: number | string;
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
  address?: string;
  price?: number;
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

export interface HistorySummary {
  totalOrders: number;
  totalRevenue: number;
  orderRevenue?: number;
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
  orders: Order[];
  expenses?: Expense[];
  debtPayments?: DebtPayment[];
}

export type DateRangePreset = 'yesterday' | 'today' | 'custom';

export type ExpensePeriod = 'yesterday' | 'today' | 'custom';

export type WarehousePeriod = 'yesterday' | 'today' | 'custom';

export interface WarehouseStock {
  full_count: number;
  empty_count: number;
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
  empty_in: number;
  full_in: number;
  full_out: number;
  exit_full?: number;
  previous_full?: number;
  previous_empty?: number;
  remaining_full: number;
  remaining_empty: number;
  notes?: string;
  created_at: string;
}

export interface WarehouseSummaryResponse {
  warehouse: WarehouseStock;
  customers: WarehouseCustomersSummary;
  last_update?: WarehouseUpdate | null;
}

export interface WarehouseStockPayload {
  full_count: number;
  empty_count: number;
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
