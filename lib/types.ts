export type UserRole = 'admin' | 'courier';

export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed';

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
  price: number;
  active_bidons: number;
  debt: number;
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

export interface DebtPayment {
  id?: number;
  customer_id?: number;
  customer_name?: string;
  amount: number;
  previous_debt?: number;
  new_debt?: number;
  created_at: string;
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
  completed_at?: string;
  payment_type?: PaymentType | string;
  amount_paid?: number | string;
  is_paid?: boolean;
  paid_at?: string | null;
}

export interface OrderPayload {
  customer_id: number;
  courier_id: number;
  bidons_count: number;
  address: string;
  price: number;
}

export interface Expense {
  id: number;
  courier_id?: number;
  courier_name: string;
  amount: number | string;
  description: string;
  category?: string;
  created_at: string;
}

export interface ExpensePayload {
  courier_id: number;
  amount: number;
  description: string;
  category?: string;
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

export type DateRangePreset = 'today' | 'week' | 'month' | 'custom';

export type ExpensePeriod = 'today' | 'week' | 'month' | 'custom';

export type WarehousePeriod = 'today' | 'week' | 'month';

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
