import type {
  Courier,
  Customer,
  CustomerPayload,
  HistoryResponse,
  Order,
  OrderPayload,
  User,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> {
  const token = skipAuth ? null : getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = undefined;
    }
    const err = data as { error?: string; message?: string };
    const message = err?.error || err?.message || `Sorğu uğursuz oldu (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type');
  if (
    contentType?.includes('spreadsheet') ||
    contentType?.includes('octet-stream') ||
    contentType?.includes('excel')
  ) {
    return res.blob() as Promise<T>;
  }

  if (contentType?.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  return undefined as T;
}

async function requestBlob(path: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new ApiError('Export uğursuz oldu', res.status);
  }
  return res.blob();
}

export async function login(email: string, password: string, licenseCode: string) {
  const data = await request<{ token: string; user: User; message?: string }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        license_code: licenseCode.trim().toUpperCase(),
      }),
    },
    true
  );

  if (!data.token || !data.user) {
    throw new ApiError('Giriş cavabı düzgün deyil', 401);
  }

  return { token: data.token, user: data.user };
}

export async function getCustomers(): Promise<Customer[]> {
  const data = await request<Customer[] | { customers?: Customer[] }>('/customers');
  if (Array.isArray(data)) return data;
  return data.customers ?? [];
}

export async function searchCustomers(q: string): Promise<Customer[]> {
  const params = new URLSearchParams({ q });
  const data = await request<Customer[] | { customers?: Customer[] }>(
    `/customers/search?${params}`
  );
  if (Array.isArray(data)) return data;
  return data.customers ?? [];
}

export async function createCustomer(payload: CustomerPayload) {
  return request('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCustomer(id: number, payload: Partial<CustomerPayload>) {
  return request(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomer(id: number) {
  return request(`/customers/${id}`, { method: 'DELETE' });
}

export async function exportCustomersExcel(): Promise<Blob> {
  return requestBlob('/customers/export');
}

export async function getOrders(params?: {
  completedToday?: boolean;
}): Promise<Order[]> {
  const search = new URLSearchParams();
  if (params?.completedToday) search.set('completedToday', 'true');
  const qs = search.toString();
  const data = await request<Order[] | { orders?: Order[] }>(
    `/orders${qs ? `?${qs}` : ''}`
  );
  if (Array.isArray(data)) return data;
  return data.orders ?? [];
}

export async function getCompletedOrders(
  period: 'today' | 'week' | 'month' | 'custom',
  startDate?: string,
  endDate?: string
): Promise<Order[]> {
  if (period === 'custom' && startDate && endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const data = await request<Order[] | { orders?: Order[] }>(
      `/orders/completed/custom?${params}`
    );
    if (Array.isArray(data)) return data;
    return data.orders ?? [];
  }
  const data = await request<Order[] | { orders?: Order[] }>(
    `/orders/completed/${period}`
  );
  if (Array.isArray(data)) return data;
  return data.orders ?? [];
}

export async function getOrderById(id: number): Promise<Order> {
  return request<Order>(`/orders/${id}`);
}

export async function createOrder(payload: OrderPayload) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOrder(id: number, payload: Partial<OrderPayload>) {
  return request(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function markOrderDone(id: number) {
  return request(`/orders/${id}/done`, { method: 'PUT' });
}

export async function markOrderPaid(id: number) {
  return request(`/orders/${id}/mark-paid`, { method: 'PUT' });
}

export async function deleteOrder(id: number) {
  return request(`/orders/${id}`, { method: 'DELETE' });
}

export async function getCouriers(): Promise<Courier[]> {
  const data = await request<Courier[] | { couriers?: Courier[] }>('/couriers');
  if (Array.isArray(data)) return data;
  return data.couriers ?? [];
}

export async function getHistory(
  period: 'today' | 'week' | 'month' | 'custom',
  startDate?: string,
  endDate?: string
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ period });
  if (period === 'custom' && startDate && endDate) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }
  return request<HistoryResponse>(`/history?${params}`);
}

export async function exportHistoryExcel(
  period: 'today' | 'week' | 'month' | 'custom',
  startDate?: string,
  endDate?: string
): Promise<Blob> {
  const params = new URLSearchParams({ period });
  if (period === 'custom' && startDate && endDate) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }
  return requestBlob(`/history/export?${params}`);
}

export { ApiError };
