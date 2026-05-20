'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Search,
  Calendar,
} from 'lucide-react';
import {
  createOrder,
  deleteOrder,
  getCouriers,
  getOrders,
  getCompletedOrders,
  markOrderDone,
  searchCustomers,
  updateOrder,
} from '@/lib/api';
import type { Courier, Customer, Order } from '@/lib/types';
import {
  formatCurrency,
  getCourierName,
  getCustomerActiveBidons,
  getCustomerName,
  getCustomerPhone,
  getCustomerPrice,
  getDateRange,
  getOrderBidonCount,
  getOrderCourierName,
  getOrderCustomerName,
  getOrderDate,
  getOrderStatusLabel,
  isOrderCompleted,
  isOrderPending,
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge, orderStatusVariant } from '@/components/ui/Badge';
import { Toast, ToastType } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

type FilterMode = 'all' | 'pending' | 'today_completed' | 'range';

const emptyOrderForm = {
  customerId: '',
  courierId: '',
  bidons: '',
  address: '',
  notes: '',
};

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [form, setForm] = useState(emptyOrderForm);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerMatches, setCustomerMatches] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const { requestConfirm, ConfirmDialog } = useConfirm();

  const showToast = (message: string, type: ToastType = 'info') =>
    setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let ordersData: Order[];
      if (filter === 'today_completed') {
        ordersData = await getOrders({ completedToday: true });
      } else if (filter === 'range' && dateFrom && dateTo) {
        ordersData = await getCompletedOrders('custom', dateFrom, dateTo);
      } else {
        ordersData = await getOrders();
        if (filter === 'pending') {
          ordersData = ordersData.filter((o) => isOrderPending(o));
        }
      }
      const couriersData = await getCouriers();
      setOrders(ordersData);
      setCouriers(couriersData);
    } catch {
      showToast('Məlumatlar yüklənə bilmədi', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, dateFrom, dateTo]);

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

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setForm((prev) => ({
      ...prev,
      customerId: String(c.id),
      address: c.address || '',
      bidons: String(getCustomerActiveBidons(c) || 1),
    }));
    setCustomerSearch(getCustomerName(c));
    setShowCustomerList(false);
  };

  const openCreate = () => {
    setEditOrder(null);
    setForm(emptyOrderForm);
    setCustomerSearch('');
    setSelectedCustomer(null);
    setModalOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditOrder(order);
    setForm({
      customerId: String(order.customer_id || ''),
      courierId: String(order.courier_id || ''),
      bidons: String(getOrderBidonCount(order)),
      address: order.address || '',
      notes: order.notes || '',
    });
    setCustomerSearch(getOrderCustomerName(order));
    setSelectedCustomer(null);
    setModalOpen(true);
  };

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
    const unitPrice = selectedCustomer ? getCustomerPrice(selectedCustomer) : 0;
    const payload = {
      customer_id: Number(form.customerId),
      courier_id: Number(form.courierId),
      bidons_count: bidons,
      address: form.address.trim(),
      price: unitPrice * bidons,
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      if (editOrder) {
        await updateOrder(editOrder.id, payload);
        showToast('Sifariş yeniləndi', 'success');
      } else {
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

  const applyPreset = (preset: 'today' | 'week' | 'month') => {
    const range = getDateRange(preset);
    setDateFrom(range.from);
    setDateTo(range.to);
    setFilter('range');
  };

  const estimatedPrice =
    selectedCustomer && form.bidons
      ? getCustomerPrice(selectedCustomer) * Number(form.bidons)
      : Number(editOrder?.price) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <OrderSearchBar search={search} onSearch={setSearch} />
          <Button onClick={openCreate}>
            <Plus size={16} />
            Yeni sifariş
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Hamısı'],
              ['pending', 'Gözləyən'],
              ['today_completed', 'Bu gün tamamlanan'],
              ['range', 'Tarix aralığı'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === key
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => applyPreset('today')}
            className="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Bu gün
          </button>
          <button
            type="button"
            onClick={() => applyPreset('week')}
            className="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Bu həftə
          </button>
        </div>

        {filter === 'range' && (
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
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
            <Button type="button" variant="secondary" onClick={load}>
              Tətbiq et
            </Button>
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Müştəri</th>
                <th className="px-5 py-3">Kuryer</th>
                <th className="px-5 py-3">Bidon</th>
                <th className="px-5 py-3">Qiymət</th>
                <th className="px-5 py-3">Tarix</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Yüklənir...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Sifariş tapılmadı
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 transition hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{getOrderCustomerName(order)}</p>
                      <p className="text-xs text-slate-500">{order.address}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{getOrderCourierName(order)}</td>
                    <td className="px-5 py-3.5 font-semibold">{getOrderBidonCount(order)}</td>
                    <td className="px-5 py-3.5 font-medium">{formatCurrency(order.price)}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {getOrderDate(order) || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={orderStatusVariant(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        {!isOrderCompleted(order) && (
                          <button
                            type="button"
                            onClick={() => handleMarkDone(order)}
                            className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                            title="Tamamla"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(order)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(order)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
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
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editOrder ? 'Sifarişi redaktə et' : 'Yeni sifariş'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Ad və ya telefon..."
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
                      <span className="ml-2 text-slate-500">{getCustomerPhone(c)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Ünvan"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              label="Bidon sayı"
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
            <Input
              label="Qeyd"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            {estimatedPrice > 0 && (
              <p className="sm:col-span-2 text-sm text-slate-600">
                Təxmini məbləğ: <strong>{formatCurrency(estimatedPrice)}</strong>
              </p>
            )}
          </div>

          <OrderFormActions saving={saving} onCancel={() => setModalOpen(false)} edit={!!editOrder} />
        </form>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {ConfirmDialog}
    </div>
  );
}

function OrderSearchBar({
  search,
  onSearch,
}: {
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="relative max-w-md flex-1">
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

function OrderFormActions({
  saving,
  onCancel,
  edit,
}: {
  saving: boolean;
  onCancel: () => void;
  edit: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <Button type="button" variant="secondary" onClick={onCancel}>
        Ləğv et
      </Button>
      <Button type="submit" loading={saving}>
        {edit ? 'Yenilə' : 'Yarat'}
      </Button>
    </div>
  );
}
