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
  phone: string;
  address: string;
  price: number;
  active_bidons: number;
  debt: number;
}

export interface Courier {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
}

export type PaymentType = 'cash' | 'card' | 'credit';

export interface Order {
  id: number;
  customer_id?: number;
  courier_id?: number;
  name?: string;
  surname?: string;
  customer_name?: string;
  customer_surname?: string;
  customer_phone?: string;
  customer?: { name?: string; surname?: string; phone?: string };
  courier_name?: string;
  bidons_count?: number;
  address?: string;
  price?: number | string;
  status?: OrderStatus | string;
  notes?: string;
  created_at?: string;
  completed_at?: string;
  payment_type?: PaymentType | string;
  amount_paid?: number | string;
  is_paid?: boolean;
  paid_at?: string | null;
}

export interface CustomerPayload {
  name: string;
  surname: string;
  phone: string;
  address: string;
  price: number;
  active_bidons: number;
  debt: number;
}

export interface OrderPayload {
  customer_id: number;
  courier_id: number;
  bidons_count: number;
  address: string;
  price: number;
  notes?: string;
}

export interface HistorySummary {
  totalOrders: number;
  totalRevenue: number;
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
}

export type DateRangePreset = 'today' | 'week' | 'month' | 'custom';
