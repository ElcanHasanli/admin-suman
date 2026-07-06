'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Search,
  Calendar,
  XCircle,
} from 'lucide-react';
import {
  createOrder,
  createOrderNote,
  deleteOrder,
  getCouriers,
  getCustomerById,
  getCustomerOrderPreview,
  getOrderById,
  getOrderNotes,
  getOrders,
  getCompletedOrders,
  markOrderDone,
  searchCustomers,
  updateOrder,
} from '@/lib/api';
import type {
  Courier,
  Customer,
  Order,
  OrderNote,
  OrderStatus,
  OrderType,
  OrdersListParams,
  CustomerOrderPreviewNote,
} from '@/lib/types';
import {
  formatCurrency,
  formatCustomerPhones,
  formatBakuTime,
  formatDateTime,
  getCourierName,
  getCustomerActiveBidons,
  getCustomerDebt,
  getCustomerName,
  getCustomerPrice,
  getDateRange,
  formatLocalDate,
  getLegacyOrderNoteText,
  getNoteAuthorLabel,
  getOrderBidonCount,
  getOrderCompletedTimeDisplay,
  getOrderCourierName,
  getOrderCustomerName,
  getOrderNotesList,
  getOrderPrice,
  getOrderScheduledDateDisplay,
  getOrderStatusLabel,
  getOrderTypeLabel,
  canMarkOrderDebtPaid,
  formatPaidAt,
  getOrderAmountPaid,
  getOrderRemainingAmount,
  getPaymentTypeLabel,
  isOrderPaid,
  isOrderCompleted,
  truncateAddress,
} from '@/lib/utils';
import { OrderDebtPaymentModal } from '@/components/history/OrderDebtPaymentModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { TableScroll } from '@/components/ui/TableScroll';
import { Badge, orderStatusVariant } from '@/components/ui/Badge';
import { Toast, ToastType } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { MobileOnly, DesktopOnly } from '@/components/ui/ResponsiveViews';
import {
  MobileCard,
  MobileCardActions,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
  MobileCardTitle,
  MobileEmpty,
} from '@/components/ui/MobileCards';

type StatusFilter = '' | OrderStatus | 'today_completed';
type CourierFilter = '' | 'unassigned' | number;
type ViewMode = 'list' | 'range';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: '', label: 'Hamısı' },
  { key: 'pending', label: 'Gözləyən' },
  { key: 'assigned', label: 'Təyin olunub' },
  { key: 'in_progress', label: 'Çatdırılır' },
  { key: 'completed', label: 'Tamamlanan' },
  { key: 'today_completed', label: 'Bu gün tamamlanan' },
];

const ORDER_TYPE_OPTIONS: { key: OrderType; label: string }[] = [
  { key: 'delivery', label: 'Çatdırılma' },
  { key: 'pickup', label: 'Boş bidon götürmə' },
];

const emptyOrderForm = {
  customerId: '',
  courierId: '',
  bidons: '',
  address: '',
};

export function OrdersView({
  prefillCustomerId = null,
  openOrderId = null,
}: {
  prefillCustomerId?: number | null;
  openOrderId?: number | null;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [courierFilter, setCourierFilter] = useState<CourierFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [form, setForm] = useState(emptyOrderForm);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerMatches, setCustomerMatches] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [previewLastNote, setPreviewLastNote] = useState<CustomerOrderPreviewNote | null>(
    null
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [scheduledDate, setScheduledDate] = useState(() => formatLocalDate());
  const [debtInput, setDebtInput] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newNoteBody, setNewNoteBody] = useState('');
  const [orderNotes, setOrderNotes] = useState<OrderNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const { requestConfirm, ConfirmDialog } = useConfirm();

  const showToast = (message: string, type: ToastType = 'info') =>
    setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const couriersData = await getCouriers();
      let ordersData: Order[];

      if (viewMode === 'range' && dateFrom && dateTo) {
        ordersData = await getCompletedOrders('custom', dateFrom, dateTo);
        ordersData = filterOrdersByCourier(ordersData, courierFilter);
      } else {
        ordersData = await getOrders(buildOrdersListParams(statusFilter, courierFilter));
      }

      setOrders(ordersData);
      setCouriers(couriersData);
    } catch {
      showToast('Məlumatlar yüklənə bilmədi', 'error');
    } finally {
      setLoading(false);
    }
  }, [viewMode, dateFrom, dateTo, statusFilter, courierFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const q = customerSearch.trim();
    if (!q || q.length < 2) {
      setCustomerMatches([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchCustomers(q);
        setCustomerMatches(results.slice(0, 8));
      } catch {
        setCustomerMatches([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = [...orders];
    if (q) {
      list = list.filter((o) => {
        const name = getOrderCustomerName(o).toLowerCase();
        const courier = getOrderCourierName(o).toLowerCase();
        return name.includes(q) || courier.includes(q);
      });
    }
    return list.sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [orders, search]);

  const applyCustomerSelection = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setForm((prev) => ({
      ...prev,
      customerId: String(customer.id),
      address: customer.address || '',
      bidons: String(getCustomerActiveBidons(customer) || 1),
    }));
    setDebtInput(String(getCustomerDebt(customer)));
    setCustomerSearch(getCustomerName(customer));
    setShowCustomerList(false);
  }, []);

  const loadCustomerPreview = useCallback(
    async (customerId: number) => {
      setPreviewLoading(true);
      setPreviewLastNote(null);
      try {
        const preview = await getCustomerOrderPreview(customerId);
        applyCustomerSelection(preview.customer);
        setPreviewLastNote(preview.last_note);
      } catch {
        try {
          const detail = await getCustomerById(customerId);
          applyCustomerSelection(detail.customer);
        } catch {
          showToast('Müştəri məlumatı yüklənə bilmədi', 'error');
        }
      } finally {
        setPreviewLoading(false);
      }
    },
    [applyCustomerSelection]
  );

  const selectCustomer = (c: Customer) => {
    void loadCustomerPreview(c.id);
  };

  const loadOrderNotes = useCallback(async (orderId: number) => {
    setNotesLoading(true);
    try {
      const notes = await getOrderNotes(orderId);
      setOrderNotes(notes);
    } catch {
      setOrderNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  const resetCreateForm = () => {
    setForm(emptyOrderForm);
    setCustomerSearch('');
    setSelectedCustomer(null);
    setPreviewLastNote(null);
    setOrderType('delivery');
    setScheduledDate(formatLocalDate());
    setDebtInput('');
    setNewNoteBody('');
    setOrderNotes([]);
  };

  const openCreate = () => {
    setEditOrder(null);
    resetCreateForm();
    setModalOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditOrder(order);
    setForm({
      customerId: String(order.customer_id || ''),
      courierId: String(order.courier_id || ''),
      bidons: String(getOrderBidonCount(order)),
      address: order.address || '',
    });
    setCustomerSearch(getOrderCustomerName(order));
    setSelectedCustomer(null);
    if (order.customer_id) {
      void getCustomerById(order.customer_id)
        .then((detail) => setSelectedCustomer(detail.customer))
        .catch(() => {});
    }
    setNewNoteBody('');
    const embedded = getOrderNotesList(order);
    const legacy = getLegacyOrderNoteText(order);
    setOrderNotes(
      embedded.length > 0
        ? embedded
        : legacy
          ? [{ id: 0, body: legacy, author_role: 'admin', created_at: order.created_at }]
          : []
    );
    loadOrderNotes(order.id);
    setModalOpen(true);
  };

  const prefillDone = useRef(false);
  const orderOpenDone = useRef(false);

  useEffect(() => {
    if (!prefillCustomerId || loading || prefillDone.current) return;
    prefillDone.current = true;
    void (async () => {
      try {
        const detail = await getCustomerById(prefillCustomerId);
        await loadCustomerPreview(detail.customer.id);
        setModalOpen(true);
      } catch {
        showToast('Müştəri yüklənə bilmədi', 'error');
      }
    })();
  }, [prefillCustomerId, loading]);

  useEffect(() => {
    if (!openOrderId || loading || orderOpenDone.current) return;
    orderOpenDone.current = true;
    void (async () => {
      try {
        const order = await getOrderById(openOrderId);
        openEdit(order);
      } catch {
        showToast('Sifariş tapılmadı', 'error');
      }
    })();
  }, [openOrderId, loading]);

  const handleMarkDone = async (order: Order) => {
    const ok = await requestConfirm({
      title: 'Sifarişi tamamla',
      message: `"${getOrderCustomerName(order)}" sifarişini tamamlanmış kimi işarələmək istəyirsiniz?`,
      confirmLabel: 'Tamamla',
      variant: 'success',
    });
    if (!ok) return;
    try {
      await markOrderDone(order.id);
      showToast('Sifariş tamamlandı', 'success');
      load();
    } catch {
      showToast('Status yenilənə bilmədi', 'error');
    }
  };

  const handleDelete = async (order: Order) => {
    const ok = await requestConfirm({
      title: 'Sifarişi sil',
      message: `"${getOrderCustomerName(order)}" sifarişini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`,
      confirmLabel: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteOrder(order.id);
      showToast('Sifariş silindi', 'success');
      load();
    } catch {
      showToast('Silinmə uğursuz oldu', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.courierId || !form.bidons) {
      showToast('Bütün sahələri doldurun', 'error');
      return;
    }

    const bidons = Number(form.bidons);
    const isPickup = !editOrder && orderType === 'pickup';

    if (!editOrder && !scheduledDate) {
      showToast('Tarix seçin', 'error');
      return;
    }

    if (!isPickup && !form.address.trim()) {
      showToast('Ünvan daxil edin', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editOrder) {
        const price = computeOrderPrice(bidons, selectedCustomer, editOrder);
        await updateOrder(editOrder.id, {
          customer_id: Number(form.customerId),
          courier_id: Number(form.courierId),
          bidons_count: bidons,
          address: form.address.trim(),
          price,
        });
        if (newNoteBody.trim()) {
          await createOrderNote(editOrder.id, newNoteBody);
        }
        showToast('Sifariş yeniləndi', 'success');
      } else {
        const noteText = newNoteBody.trim();
        const debtValue = parseFloat(debtInput);
        const payload: Parameters<typeof createOrder>[0] = {
          customer_id: Number(form.customerId),
          courier_id: Number(form.courierId),
          order_type: orderType,
          scheduled_date: scheduledDate,
          bidons_count: bidons,
          notes: noteText || undefined,
        };

        if (selectedCustomer && !Number.isNaN(debtValue)) {
          payload.debt = debtValue;
        }

        if (isPickup) {
          payload.price = 0;
          if (form.address.trim()) payload.address = form.address.trim();
        } else {
          const price = computeOrderPrice(bidons, selectedCustomer, null);
          if (price <= 0) {
            showToast('Müştəri seçin', 'error');
            setSaving(false);
            return;
          }
          payload.address = form.address.trim();
          payload.price = price;
        }

        await createOrder(payload);
        showToast('Sifariş yaradıldı', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isPickupCreate = !editOrder && orderType === 'pickup';
  const estimatedPrice = isPickupCreate
    ? 0
    : computeOrderPrice(Number(form.bidons) || 0, selectedCustomer, editOrder);

  const applyDatePreset = (preset: 'yesterday' | 'today') => {
    const range = getDateRange(preset);
    setDateFrom(range.from);
    setDateTo(range.to);
    setViewMode('range');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <OrderSearchBar search={search} onSearch={setSearch} />
          <Button onClick={openCreate} className="w-full shrink-0 sm:w-auto">
            <Plus size={16} />
            Yeni sifariş
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {STATUS_FILTERS.map(({ key, label }) => (
              <button
                key={key || 'all'}
                type="button"
                onClick={() => {
                  setStatusFilter(key);
                  setViewMode('list');
                }}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  viewMode === 'list' && statusFilter === key
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setViewMode('range')}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                viewMode === 'range'
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              Tarix aralığı
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('yesterday')}
              className="shrink-0 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Dünən
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('today')}
              className="shrink-0 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Bu gün
            </button>
          </div>

          <select
            value={courierFilter === '' ? '' : String(courierFilter)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') setCourierFilter('');
              else if (v === 'unassigned') setCourierFilter('unassigned');
              else setCourierFilter(Number(v));
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:w-auto sm:min-w-[180px]"
          >
            <option value="">Kuryer: Hamısı</option>
            <option value="unassigned">Kuryersiz</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {getCourierName(c)}
              </option>
            ))}
          </select>
        </div>

        {viewMode === 'range' && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
            <Input
              label="Başlanğıc"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              label="Son"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={load} className="w-full sm:w-auto">
              Tətbiq et
            </Button>
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <MobileOnly>
          <div className="p-3">
            {loading ? (
              <MobileEmpty>Yüklənir...</MobileEmpty>
            ) : filteredOrders.length === 0 ? (
              <MobileEmpty>Sifariş tapılmadı</MobileEmpty>
            ) : (
              <MobileCardList>
                {filteredOrders.map((order) => (
                  <MobileCard key={order.id}>
                    <MobileCardTitle
                      badge={
                        <Badge variant={orderStatusVariant(order.status)}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      }
                      subtitle={`${getOrderTypeLabel(order.order_type)} · ${getOrderCourierName(order)}`}
                    >
                      {getOrderCustomerName(order)}
                    </MobileCardTitle>
                    <MobileCardGrid>
                      <MobileCardField label="Bidon" value={getOrderBidonCount(order)} />
                      <MobileCardField
                        label="Qiymət"
                        value={formatCurrency(order.price)}
                      />
                      <MobileCardField
                        label="İcra günü"
                        value={getOrderScheduledDateDisplay(order)}
                      />
                      {order.assigned_at_baku && (
                        <MobileCardField
                          label="Təyin vaxtı"
                          value={formatBakuTime(order.assigned_at_baku)}
                        />
                      )}
                      {isOrderCompleted(order) && order.payment_type && (
                        <MobileCardField
                          label="Ödəniş"
                          value={<CompletedOrderPayment order={order} />}
                        />
                      )}
                    </MobileCardGrid>
                    {order.address && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">{order.address}</p>
                    )}
                    <MobileCardActions>
                      {canMarkOrderDebtPaid(order) && (
                        <button
                          type="button"
                          onClick={() => setPayOrder(order)}
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          Borc ödə
                        </button>
                      )}
                      {!isOrderCompleted(order) && (
                        <button
                          type="button"
                          onClick={() => handleMarkDone(order)}
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          Tamamla
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(order)}
                        className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700"
                      >
                        Redaktə
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(order)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
                      >
                        Sil
                      </button>
                    </MobileCardActions>
                  </MobileCard>
                ))}
              </MobileCardList>
            )}
          </div>
        </MobileOnly>
        <DesktopOnly>
        <TableScroll minWidth={760}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 sm:px-5 sm:py-3">Müştəri</th>
                <th className="hidden px-3 py-2.5 sm:table-cell sm:px-5 sm:py-3">Kuryer</th>
                <th className="px-3 py-2.5 sm:px-5 sm:py-3">Bidon</th>
                <th className="px-3 py-2.5 sm:px-5 sm:py-3">Qiymət</th>
                <th className="px-3 py-2.5 sm:px-5 sm:py-3">Tarix</th>
                <th className="px-3 py-2.5 sm:px-5 sm:py-3">Status</th>
                <th className="hidden px-3 py-2.5 sm:table-cell sm:px-5 sm:py-3">Ödəniş</th>
                <th className="px-3 py-2.5 text-right sm:px-5 sm:py-3">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-slate-400 sm:px-5">
                    Yüklənir...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-slate-400 sm:px-5">
                    Sifariş tapılmadı
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 transition hover:bg-slate-50/50"
                  >
                    <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                      <p className="font-medium text-slate-900">{getOrderCustomerName(order)}</p>
                      <p className="text-xs text-slate-500">{getOrderTypeLabel(order.order_type)}</p>
                      <p className="text-xs text-slate-500">{order.address}</p>
                      <p className="mt-0.5 text-xs text-slate-400 sm:hidden">
                        {getOrderCourierName(order)}
                      </p>
                    </td>
                    <td className="hidden px-3 py-3 text-slate-600 sm:table-cell sm:px-5 sm:py-3.5">
                      {getOrderCourierName(order)}
                    </td>
                    <td className="px-3 py-3 font-semibold sm:px-5 sm:py-3.5">{getOrderBidonCount(order)}</td>
                    <td className="px-3 py-3 font-medium sm:px-5 sm:py-3.5">{formatCurrency(order.price)}</td>
                    <td className="px-3 py-3 text-slate-600 sm:px-5 sm:py-3.5">
                      <span className="flex flex-col gap-0.5 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} className="shrink-0" />
                          {getOrderScheduledDateDisplay(order)}
                        </span>
                        {order.assigned_at_baku && (
                          <span className="pl-5 text-xs text-slate-400">
                            {formatBakuTime(order.assigned_at_baku)}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                      <Badge variant={orderStatusVariant(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell sm:px-5 sm:py-3.5">
                      {isOrderCompleted(order) && order.payment_type ? (
                        <CompletedOrderPayment order={order} />
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                      <div className="flex justify-end gap-1">
                        {canMarkOrderDebtPaid(order) && (
                          <button
                            type="button"
                            onClick={() => setPayOrder(order)}
                            className="rounded-lg px-2.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            title="Borc ödə"
                          >
                            Borc ödə
                          </button>
                        )}
                        {!isOrderCompleted(order) && (
                          <button
                            type="button"
                            onClick={() => handleMarkDone(order)}
                            className="rounded-lg p-2.5 text-emerald-600 transition hover:bg-emerald-50"
                            title="Tamamla"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(order)}
                          className="rounded-lg p-2.5 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(order)}
                          className="rounded-lg p-2.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableScroll>
        </DesktopOnly>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editOrder ? 'Sifarişi redaktə et' : 'Yeni sifariş'}
        size="lg"
        footer={
          <OrderFormActions
            formId="order-form"
            saving={saving}
            onCancel={() => setModalOpen(false)}
            edit={!!editOrder}
          />
        }
      >
        <form id="order-form" onSubmit={handleSubmit} className="space-y-4">
          {!editOrder && (
            <>
              <div className="flex gap-2">
                {ORDER_TYPE_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOrderType(key)}
                    className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      orderType === key
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Input
                label="İcra tarixi"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </>
          )}

          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Müştəri axtar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerList(true);
                }}
                onFocus={() => setShowCustomerList(true)}
                placeholder="Ad, telefon və ya ünvan..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            {showCustomerList && customerMatches.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {customerMatches.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-sky-50"
                    >
                      <span className="font-medium">{getCustomerName(c)}</span>
                      <span className="ml-2 text-slate-500">{formatCustomerPhones(c)}</span>
                      {c.address?.trim() && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {truncateAddress(c.address, 64)}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedCustomer && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              {previewLoading ? (
                <p className="text-sm text-slate-400">Müştəri məlumatı yüklənir...</p>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Nisyə borcu (₼)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={debtInput}
                      onChange={(e) => setDebtInput(e.target.value)}
                      disabled={!!editOrder}
                    />
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-700">Aktiv bidon</p>
                      <p className="mt-1">{getCustomerActiveBidons(selectedCustomer)}</p>
                    </div>
                  </div>
                  {previewLastNote && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Son qeyd
                        {previewLastNote.author_name
                          ? ` · ${previewLastNote.author_name}`
                          : previewLastNote.author_role
                            ? ` · ${getNoteAuthorLabel(previewLastNote.author_role)}`
                            : ''}
                        {previewLastNote.created_at
                          ? ` · ${formatDateTime(previewLastNote.created_at)}`
                          : ''}
                      </p>
                      <p className="mt-1 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-100">
                        {previewLastNote.body}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {!isPickupCreate && (
              <Input
                label="Ünvan"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required={!isPickupCreate}
              />
            )}
            <Input
              label={
                isPickupCreate ? 'Götürüləcək boş bidon' : 'Bidon sayı'
              }
              type="number"
              min="1"
              value={form.bidons}
              onChange={(e) => setForm({ ...form, bidons: e.target.value })}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Kuryer</label>
              <select
                value={form.courierId}
                onChange={(e) => setForm({ ...form, courierId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                required
              >
                <option value="">Seçin...</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCourierName(c)}
                  </option>
                ))}
              </select>
            </div>
            <OrderNotesSection
              loading={notesLoading}
              notes={orderNotes}
              newNoteBody={newNoteBody}
              onNewNoteChange={setNewNoteBody}
              createMode={!editOrder}
            />
            {!isPickupCreate && estimatedPrice > 0 && (
              <p className="sm:col-span-2 text-sm text-slate-600">
                Təxmini məbləğ: <strong>{formatCurrency(estimatedPrice)}</strong>
              </p>
            )}
          </div>
        </form>
      </Modal>

      <OrderDebtPaymentModal
        open={!!payOrder}
        order={payOrder}
        onClose={() => setPayOrder(null)}
        onSuccess={(message) => {
          setPayOrder(null);
          showToast(message, 'success');
          void load();
        }}
      />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {ConfirmDialog}
    </div>
  );
}

function OrderNotesSection({
  loading,
  notes,
  newNoteBody,
  onNewNoteChange,
  createMode = false,
}: {
  loading: boolean;
  notes: OrderNote[];
  newNoteBody: string;
  onNewNoteChange: (v: string) => void;
  createMode?: boolean;
}) {
  return (
    <div className="sm:col-span-2">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {createMode ? 'Qeyd' : 'Sifariş qeydləri'}
      </label>
      {!createMode && (
        <>
          {loading ? (
            <p className="mb-3 text-sm text-slate-400">Qeydlər yüklənir...</p>
          ) : notes.length > 0 ? (
            <ul className="mb-3 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              {notes.map((n) => (
                <li key={n.id} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        n.author_role === 'admin'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {getNoteAuthorLabel(n.author_role)}
                    </span>
                    {n.created_at && <span>{formatDateTime(n.created_at)}</span>}
                  </div>
                  <p className="mt-1 text-slate-800">{n.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-slate-400">Hələ qeyd yoxdur</p>
          )}
        </>
      )}
      <textarea
        value={newNoteBody}
        onChange={(e) => onNewNoteChange(e.target.value)}
        placeholder={
          createMode
            ? 'Kuryer üçün qeyd (məs: zəng et, qapı kodu...)'
            : 'Yeni qeyd (admin təlimatı)...'
        }
        rows={3}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
      {!createMode && (
        <p className="mt-1 text-xs text-slate-400">
          Saxlayanda yeni qeyd əlavə olunur; köhnə qeydlər silinmir.
        </p>
      )}
    </div>
  );
}

function computeOrderPrice(
  bidons: number,
  customer: Customer | null,
  editOrder: Order | null
): number {
  if (!bidons || bidons <= 0) return 0;
  if (customer) return getCustomerPrice(customer) * bidons;
  if (editOrder) {
    const existing = getOrderPrice(editOrder);
    const existingBidons = getOrderBidonCount(editOrder);
    if (existingBidons > 0) return (existing / existingBidons) * bidons;
    return existing;
  }
  return 0;
}

function buildOrdersListParams(
  status: StatusFilter,
  courier: CourierFilter
): OrdersListParams {
  const params: OrdersListParams = {};
  if (status === 'today_completed') {
    params.completedToday = true;
  } else if (status) {
    params.status = status;
  }
  if (courier === 'unassigned') {
    params.courier_id = 'unassigned';
  } else if (courier !== '') {
    params.courier_id = courier;
  }
  return params;
}

function filterOrdersByCourier(orders: Order[], courier: CourierFilter): Order[] {
  if (courier === '') return orders;
  if (courier === 'unassigned') {
    return orders.filter((o) => o.courier_id == null);
  }
  return orders.filter((o) => o.courier_id === courier);
}

function OrderSearchBar({
  search,
  onSearch,
}: {
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="relative w-full min-w-0 flex-1 lg:max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Müştəri və ya kuryer axtar..."
        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

function CompletedOrderPayment({ order }: { order: Order }) {
  const label = getPaymentTypeLabel(order.payment_type);
  if (isOrderPaid(order)) {
    return (
      <div className="space-y-0.5">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <CheckCircle size={14} className="shrink-0" />
          Ödənilib
        </span>
        {order.paid_at && (
          <p className="text-[11px] text-slate-400">{formatPaidAt(order.paid_at)}</p>
        )}
      </div>
    );
  }

  const remaining = getOrderRemainingAmount(order);
  const paid = getOrderAmountPaid(order);

  return (
    <div className="space-y-0.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {paid > 0 ? (
        <span className="text-xs font-medium text-amber-700">
          Qismən · Qalan {formatCurrency(remaining)}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
          <XCircle size={14} className="shrink-0" />
          Ödənilməyib
        </span>
      )}
    </div>
  );
}

function OrderFormActions({
  formId,
  saving,
  onCancel,
  edit,
}: {
  formId: string;
  saving: boolean;
  onCancel: () => void;
  edit: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
      <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
        Ləğv et
      </Button>
      <Button type="submit" form={formId} loading={saving} className="w-full sm:w-auto">
        {edit ? 'Yenilə' : 'Sifarişi yarat'}
      </Button>
    </div>
  );
}
