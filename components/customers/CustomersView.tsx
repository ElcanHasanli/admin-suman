'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download, Search } from 'lucide-react';
import {
  ApiError,
  createCustomer,
  deleteCustomer,
  exportCustomersExcel,
  getCustomers,
  updateCustomer,
} from '@/lib/api';
import type { Customer } from '@/lib/types';
import {
  buildCustomerPayload,
  customerToFormFields,
  downloadBlob,
  formatCurrency,
  formatCustomerPhones,
  getCustomerActiveBidons,
  getCustomerDebt,
  getCustomerName,
  getCustomerPhone,
  getCustomerPhone2,
  getCustomerPrice,
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { TableScroll } from '@/components/ui/TableScroll';
import { Toast, ToastType } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

const emptyForm = {
  fullName: '',
  phone: '',
  phone2: '',
  address: '',
  price: '',
  activeBidons: '',
  debt: '',
};

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const { requestConfirm, ConfirmDialog } = useConfirm();

  const showToast = (message: string, type: ToastType = 'info') =>
    setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch {
      showToast('Müştərilər yüklənə bilmədi', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = getCustomerName(c).toLowerCase();
      const phone = getCustomerPhone(c).toLowerCase();
      const phone2 = getCustomerPhone2(c).toLowerCase();
      const address = (c.address || '').toLowerCase();
      return (
        name.includes(q) ||
        phone.includes(q) ||
        phone2.includes(q) ||
        address.includes(q)
      );
    });
  }, [customers, search]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditId(c.id);
    setForm(customerToFormFields(c));
    setModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const blob = await exportCustomersExcel();
      downloadBlob(blob, `musteriler_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast('Excel faylı yükləndi', 'success');
    } catch {
      showToast('Export uğursuz oldu', 'error');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const ok = await requestConfirm({
      title: 'Müştərini sil',
      message: `"${name}" müştərisini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`,
      confirmLabel: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteCustomer(id);
      showToast('Müştəri silindi', 'success');
      load();
    } catch {
      showToast('Silinmə uğursuz oldu', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    const activeBidons = form.activeBidons === '' ? 0 : Number(form.activeBidons);
    const debt = form.debt === '' ? 0 : Number(form.debt);

    if (!form.fullName.trim() || !form.address.trim() || !form.phone.trim()) {
      showToast('Ad, telefon və ünvan mütləqdir', 'error');
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast('Qiymət düzgün deyil', 'error');
      return;
    }

    const payload = buildCustomerPayload({
      fullName: form.fullName,
      phone: form.phone,
      phone2: form.phone2,
      address: form.address,
      price,
      activeBidons,
      debt,
    });

    setSaving(true);
    try {
      if (editId) {
        const result = await updateCustomer(editId, payload);
        if (result.debt_payment && result.debt_payment.amount > 0) {
          showToast(
            `Müştəri yeniləndi. Borc ödənişi: ${formatCurrency(result.debt_payment.amount)} (tarixçədə görünəcək)`,
            'success'
          );
        } else {
          showToast('Müştəri yeniləndi', 'success');
        }
      } else {
        await createCustomer(payload);
        showToast('Yeni müştəri əlavə edildi', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? err.message || 'Bu telefon nömrəsi artıq başqa müştəriyə aid edilib'
          : err instanceof Error
            ? err.message
            : 'Xəta baş verdi';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        search={search}
        onSearch={setSearch}
        onExport={handleExport}
        onCreate={openCreate}
      />

      <Card className="overflow-hidden">
        <CustomersTable
          loading={loading}
          customers={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Müştərini redaktə et' : 'Yeni müştəri'}
      >
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Ad Soyad"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Elcan Həsənli"
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              Soyad opsionaldır — boşluqdan sonra yazıla bilər
            </p>
          </div>
          <Input
            label="Telefon"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="050 123 45 67"
            required
          />
          <Input
            label="Telefon 2 (opsional)"
            value={form.phone2}
            onChange={(e) => setForm({ ...form, phone2: e.target.value })}
            placeholder="055 999 88 77"
          />
          <Input
            label="Qiymət (₼/bidon)"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Ünvan"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>
          <Input
            label="Aktiv bidon"
            type="number"
            min="0"
            value={form.activeBidons}
            onChange={(e) => setForm({ ...form, activeBidons: e.target.value })}
          />
          <Input
            label="Borc (₼)"
            type="number"
            min="0"
            step="0.01"
            value={form.debt}
            onChange={(e) => setForm({ ...form, debt: e.target.value })}
          />
          {editId && (
            <p className="text-xs text-slate-500 sm:col-span-2">
              Borc azaldıqda ödənilən məbləğ tarixçədə «Borc ödənişi» kimi qeyd olunur.
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Ləğv et
            </Button>
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              {editId ? 'Yenilə' : 'Əlavə et'}
            </Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {ConfirmDialog}
    </div>
  );
}

function Toolbar({
  search,
  onSearch,
  onExport,
  onCreate,
}: {
  search: string;
  onSearch: (v: string) => void;
  onExport: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Ad, telefon və ya ünvan axtar..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
        <Button variant="secondary" onClick={onExport} className="w-full sm:w-auto">
          <Download size={16} />
          Excel
        </Button>
        <Button onClick={onCreate} className="w-full sm:w-auto">
          <Plus size={16} />
          Yeni müştəri
        </Button>
      </div>
    </div>
  );
}

function CustomersTable({
  loading,
  customers,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  customers: Customer[];
  onEdit: (c: Customer) => void;
  onDelete: (id: number, name: string) => void;
}) {
  return (
    <TableScroll minWidth={760}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Ad Soyad</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Telefon</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Ünvan</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Qiymət</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Aktiv bidon</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Borc</th>
            <th className="px-3 py-2.5 text-right sm:px-5 sm:py-3">Əməliyyat</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="px-3 py-12 text-center text-slate-400 sm:px-5">
                Yüklənir...
              </td>
            </tr>
          ) : customers.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-12 text-center text-slate-400 sm:px-5">
                Müştəri tapılmadı
              </td>
            </tr>
          ) : (
            customers.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 transition hover:bg-slate-50/50">
                <td className="px-3 py-3 font-medium text-slate-900 sm:px-5 sm:py-3.5">
                  {getCustomerName(c)}
                </td>
                <td className="px-3 py-3 text-slate-600 sm:px-5 sm:py-3.5">
                  {formatCustomerPhones(c)}
                </td>
                <td className="max-w-[140px] truncate px-3 py-3 text-slate-600 sm:max-w-[200px] sm:px-5 sm:py-3.5">
                  {c.address}
                </td>
                <td className="px-3 py-3 font-medium sm:px-5 sm:py-3.5">
                  {formatCurrency(getCustomerPrice(c))}
                </td>
                <td className="px-3 py-3 font-semibold text-sky-700 sm:px-5 sm:py-3.5">
                  {getCustomerActiveBidons(c)}
                </td>
                <td className="px-3 py-3 font-semibold text-red-600 sm:px-5 sm:py-3.5">
                  {formatCurrency(getCustomerDebt(c))}
                </td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(c)}
                      className="rounded-lg p-2.5 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
                      title="Redaktə"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(c.id, getCustomerName(c))}
                      className="rounded-lg p-2.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      title="Sil"
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
  );
}
