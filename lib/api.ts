import type {
  Courier,
  Customer,
  CustomerDetailResponse,
  CustomerOrderPreviewResponse,
  CustomerPayload,
  CustomersListParams,
  CustomersListResponse,
  DebtPayment,
  Expense,
  ExpensePayload,
  ExpensePeriod,
  HistoryDashboardResponse,
  HistoryPeriod,
  HistoryResponse,
  DebtorsListResponse,
  PayCustomerDebtResponse,
  Order,
  OrderNote,
  OrderPayload,
  OrdersListParams,
  MarkOrderPaidResponse,
  UpdateCustomerResponse,
  User,
  WarehousePeriod,
  WarehouseStockPayload,
  WarehouseSummaryResponse,
  WarehouseUpdate,
  AdminNotification,
} from './types';
import { getCustomerName, getCustomerPhone } from './utils';

const PRODUCTION_API = 'https://api.suman.khamsacraft.az/api';

function isLocalApiUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/.test(url);
}

/** Mobil build-də .env.local localhost qalsa belə production API istifadə et */
export function getApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API;
  if (typeof window === 'undefined') return env;
  if (isLocalApiUrl(env) && window.location.protocol !== 'http:') {
    return PRODUCTION_API;
  }
  return env;
}

function networkErrorMessage(): string {
  return 'Serverə qoşulmaq mümkün olmadı. İnternet bağlantısını yoxlayın.';
}

function throwIfNetworkFailure(error: unknown): never {
  if (error instanceof ApiError) throw error;
  const msg = error instanceof Error ? error.message : '';
  if (
    error instanceof TypeError ||
    msg === 'Load failed' ||
    msg === 'Failed to fetch' ||
    msg.includes('NetworkError')
  ) {
    throw new ApiError(networkErrorMessage(), 0);
  }
  throw error;
}

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

/** Backend müxtəlif JSON formatları qaytara bilər */
function unwrapList<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== 'object') return [];

  const obj = data as Record<string, unknown>;

  for (const key of keys) {
    const val = obj[key];
    if (Array.isArray(val)) return val as T[];
  }

  if (Array.isArray(obj.data)) return obj.data as T[];

  if (obj.data && typeof obj.data === 'object') {
    const nested = obj.data as Record<string, unknown>;
    for (const key of keys) {
      const val = nested[key];
      if (Array.isArray(val)) return val as T[];
    }
  }

  return [];
}

/** V2 migrasiya edilməyibsə (debt_payments və s.) */
export function isBackendMigrationError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('debt_payments') ||
    msg.includes('does not exist') ||
    msg.includes('relation')
  );
}

export function getMigrationErrorHint(err?: unknown): string {
  const msg =
    err instanceof ApiError
      ? (err.message || '').toLowerCase()
      : err instanceof Error
        ? err.message.toLowerCase()
        : '';
  if (msg.includes('warehouse')) {
    return 'Anbar migrasiyası: serverdə npm run db:migrate:warehouse && pm2 restart all';
  }
  if (msg.includes('device_token')) {
    return 'Serverdə push migrasiyası: npm run db:migrate:devices && pm2 restart all';
  }
  return 'Backend V2 migrasiya işlədilməyib. Serverdə: npm run db:migrate:v2';
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

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });
  } catch (error) {
    throwIfNetworkFailure(error);
  }

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
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (error) {
    throwIfNetworkFailure(error);
  }
  if (!res.ok) {
    let message = `Export uğursuz oldu (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      message = data?.error || data?.message || message;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text.slice(0, 200);
      } catch {
        /* ignore */
      }
    }
    throw new ApiError(message, res.status);
  }
  const blob = await res.blob();
  if (blob.size === 0) {
    throw new ApiError('Server boş fayl qaytardı', res.status);
  }
  return blob;
}

/** Hər cihaz öz platforması ilə (UNIQUE user_id + platform + app) */
export async function registerDeviceToken(
  token: string,
  platform: 'ios' | 'android'
): Promise<void> {
  if (!token.trim()) {
    throw new ApiError('FCM token boşdur', 400);
  }
  await request('/devices/register', {
    method: 'POST',
    body: JSON.stringify({
      token: token.trim(),
      platform,
      app: 'admin',
    }),
  });
}

export async function unregisterDeviceToken(token: string): Promise<void> {
  await request('/devices/unregister', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
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

export const CUSTOMERS_DEFAULT_PAGE_SIZE = 20;

function filterCustomersByQuery(list: Customer[], q: string): Customer[] {
  const lower = q.toLowerCase();
  return list.filter((c) => {
    const name = getCustomerName(c).toLowerCase();
    const phone = getCustomerPhone(c).toLowerCase();
    const phone2 = (c.phone2 || '').toLowerCase();
    const address = (c.address || '').toLowerCase();
    return (
      name.includes(lower) ||
      phone.includes(lower) ||
      phone2.includes(lower) ||
      address.includes(lower)
    );
  });
}

function paginateCustomersList(
  list: Customer[],
  page: number,
  limit: number
): CustomersListResponse {
  const total = list.length;
  const start = (page - 1) * limit;
  return {
    customers: list.slice(start, start + limit),
    total,
    page,
    limit,
  };
}

/** Paginated siyahı; köhnə API (yalnız massiv) üçün client-side fallback */
export async function getCustomers(
  params: CustomersListParams = {}
): Promise<CustomersListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(
    1,
    Math.min(params.limit ?? CUSTOMERS_DEFAULT_PAGE_SIZE, 100)
  );
  const q = params.q?.trim() ?? '';

  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (q) searchParams.set('q', q);

  const data = await request<unknown>(`/customers?${searchParams}`);

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const customers = unwrapList<Customer>(obj, ['customers']);
    const totalRaw = obj.total;
    if (totalRaw != null && totalRaw !== '') {
      return {
        customers,
        total: Number(totalRaw) || 0,
        page: Number(obj.page) || page,
        limit: Number(obj.limit) || limit,
      };
    }
    let list = customers;
    if (q) list = filterCustomersByQuery(list, q);
    return paginateCustomersList(list, page, limit);
  }

  let list = unwrapList<Customer>(data, ['customers']);
  if (q) list = filterCustomersByQuery(list, q);
  return paginateCustomersList(list, page, limit);
}

export async function getCustomerById(id: number): Promise<CustomerDetailResponse> {
  return request<CustomerDetailResponse>(`/customers/${id}`);
}

export async function getCustomerOrderPreview(
  id: number
): Promise<CustomerOrderPreviewResponse> {
  return request<CustomerOrderPreviewResponse>(`/customers/${id}/order-preview`);
}

export async function searchCustomers(q: string): Promise<Customer[]> {
  const params = new URLSearchParams({ q: q.trim() });
  const data = await request<unknown>(`/customers/search?${params}`);
  return unwrapList<Customer>(data, ['customers']);
}

export async function getDebtors(
  params: { page?: number; limit?: number; q?: string } = {}
): Promise<DebtorsListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(params.limit ?? 20, 100));
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const q = params.q?.trim();
  if (q) searchParams.set('q', q);
  return request<DebtorsListResponse>(`/customers/debtors?${searchParams}`);
}

export async function payCustomerDebt(
  customerId: number,
  payload?: { amount?: number }
): Promise<PayCustomerDebtResponse> {
  return request<PayCustomerDebtResponse>(`/customers/${customerId}/pay-debt`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  });
}

export function getPayDebtErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const code = (err.data as { code?: string } | undefined)?.code;
    if (code === 'NO_DEBT') return 'Müştərinin borcu yoxdur';
    if (code === 'AMOUNT_EXCEEDS_DEBT') return 'Məbləğ borcdan böyükdür';
    return err.message;
  }
  return err instanceof Error ? err.message : 'Borc ödənişi qeydə alınmadı';
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  return request<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCustomer(
  id: number,
  payload: Partial<CustomerPayload>
): Promise<UpdateCustomerResponse> {
  return request<UpdateCustomerResponse>(`/customers/${id}`, {
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

export async function getOrders(params?: OrdersListParams): Promise<Order[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.courier_id != null) {
    search.set('courier_id', String(params.courier_id));
  }
  if (params?.completedToday) search.set('completedToday', 'true');
  const qs = search.toString();
  const data = await request<unknown>(`/orders${qs ? `?${qs}` : ''}`);
  return unwrapList<Order>(data, ['orders']);
}

export async function getCompletedOrders(
  period: 'today' | 'yesterday' | 'custom',
  startDate?: string,
  endDate?: string
): Promise<Order[]> {
  if (period === 'custom' && startDate && endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const data = await request<unknown>(`/orders/completed/custom?${params}`);
    return unwrapList<Order>(data, ['orders']);
  }
  const data = await request<unknown>(`/orders/completed/${period}`);
  return unwrapList<Order>(data, ['orders']);
}

export async function getOrderById(id: number): Promise<Order> {
  return request<Order>(`/orders/${id}`);
}

export async function createOrder(payload: OrderPayload): Promise<Order> {
  return request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getOrderNotes(orderId: number): Promise<OrderNote[]> {
  const data = await request<OrderNote[] | { notes?: OrderNote[] }>(
    `/orders/${orderId}/notes`
  );
  if (Array.isArray(data)) return data;
  return data.notes ?? [];
}

export async function createOrderNote(orderId: number, body: string): Promise<OrderNote> {
  return request<OrderNote>(`/orders/${orderId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body: body.trim() }),
  });
}

export async function getExpenses(
  period: ExpensePeriod,
  courierId?: number,
  startDate?: string,
  endDate?: string
): Promise<Expense[]> {
  const params = new URLSearchParams({ period });
  if (courierId) params.set('courier_id', String(courierId));
  if (period === 'custom' && startDate && endDate) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }
  const data = await request<Expense[] | { expenses?: Expense[] }>(`/expenses?${params}`);
  if (Array.isArray(data)) return data;
  return data.expenses ?? [];
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  return request<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(id: number): Promise<void> {
  return request(`/expenses/${id}`, { method: 'DELETE' });
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

export async function markOrderPaid(
  id: number,
  payload?: { amount?: number }
): Promise<MarkOrderPaidResponse> {
  return request<MarkOrderPaidResponse>(`/orders/${id}/mark-paid`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
  });
}

export function getMarkPaidErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const code = (err.data as { code?: string } | undefined)?.code;
    if (code === 'ORDER_ALREADY_PAID') return 'Sifariş artıq tam ödənilib';
    if (code === 'AMOUNT_EXCEEDS_ORDER') return 'Məbləğ sifariş qalığından böyükdür';
    if (code === 'AMOUNT_EXCEEDS_PAYABLE')
      return 'Məbləğ tamamlama zamanı ödənilə biləcək həddən böyükdür';
    return err.message;
  }
  return err instanceof Error ? err.message : 'Ödəniş qeydə alınmadı';
}

export async function deleteOrder(id: number) {
  return request(`/orders/${id}`, { method: 'DELETE' });
}

export async function getCouriers(): Promise<Courier[]> {
  const data = await request<unknown>('/couriers');
  return unwrapList<Courier>(data, ['couriers']);
}

type HistoryApiResponse = HistoryResponse & { debt_payments?: DebtPayment[] };

/** Backend bəzən snake_case (`debt_payments`) qaytarır */
function normalizeHistoryResponse(data: HistoryApiResponse): HistoryResponse {
  const expenses =
    data.expenses ??
    (data as { expenses_list?: Expense[] }).expenses_list ??
    [];
  const debtPayments = data.debtPayments ?? data.debt_payments ?? [];
  return { ...data, expenses, debtPayments };
}

function buildHistorySearchParams(
  period: HistoryPeriod,
  startDate?: string,
  endDate?: string,
  courierId?: number
): URLSearchParams {
  const params = new URLSearchParams({ period });
  if (period === 'custom' && startDate && endDate) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }
  if (courierId) params.set('courier_id', String(courierId));
  return params;
}

export async function getHistoryDashboard(
  period: HistoryPeriod,
  startDate?: string,
  endDate?: string,
  courierId?: number
): Promise<HistoryDashboardResponse> {
  const params = buildHistorySearchParams(period, startDate, endDate, courierId);
  const data = await request<HistoryDashboardResponse & { couriers?: Courier[] }>(
    `/history/dashboard?${params}`
  );
  return {
    period: data.period,
    dashboard: data.dashboard,
    couriers: data.couriers ?? [],
    by_courier: data.by_courier,
  };
}

export async function getHistory(
  period: HistoryPeriod,
  startDate?: string,
  endDate?: string,
  courierId?: number
): Promise<HistoryResponse> {
  const params = buildHistorySearchParams(period, startDate, endDate, courierId);
  const data = await request<HistoryApiResponse>(`/history?${params}`);
  return normalizeHistoryResponse(data);
}

export async function exportHistoryExcel(
  period: HistoryPeriod,
  startDate?: string,
  endDate?: string,
  courierId?: number
): Promise<Blob> {
  const params = buildHistorySearchParams(period, startDate, endDate, courierId);
  return requestBlob(`/history/export?${params}`);
}

export async function getWarehouseSummary(): Promise<WarehouseSummaryResponse> {
  return request<WarehouseSummaryResponse>('/warehouse/summary');
}

export async function getWarehouseUpdates(
  period: WarehousePeriod,
  courierId?: number,
  startDate?: string,
  endDate?: string
): Promise<WarehouseUpdate[]> {
  const params = new URLSearchParams({ period });
  if (courierId) params.set('courier_id', String(courierId));
  if (period === 'custom' && startDate && endDate) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }
  const data = await request<unknown>(`/warehouse/updates?${params}`);
  return unwrapList<WarehouseUpdate>(data, ['updates']);
}

export async function patchWarehouseStock(
  payload: WarehouseStockPayload
): Promise<WarehouseSummaryResponse> {
  return request<WarehouseSummaryResponse>('/warehouse/stock', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** Login və səhifə açılışında backend passiv müştəri yoxlaması işlədə bilər */
export async function getNotifications(): Promise<AdminNotification[]> {
  const data = await request<unknown>('/notifications');
  return unwrapList<AdminNotification>(data, ['notifications']);
}

export { ApiError };
