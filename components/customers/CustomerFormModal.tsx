'use client';

import { useEffect, useState } from 'react';
import { ApiError, createCustomer, updateCustomer } from '@/lib/api';
import type { Customer } from '@/lib/types';
import {
  buildCustomerPayload,
  customerToFormFields,
  formatCurrency,
  getCustomerName,
  parseMoney,
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastType } from '@/components/ui/Toast';

const emptyForm = {
  fullName: '',
  phone: '',
  phone2: '',
  address: '',
  price: '',
  activeBidons: '',
  debt: '',
  deposit: '',
  notes: '',
};

export function CustomerFormModal({
  open,
  onClose,
  customer,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSaved: () => void;
}) {
  const editId = customer?.id ?? null;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    if (open) {
      setForm(customer ? customerToFormFields(customer) : emptyForm);
    }
  }, [open, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    const activeBidons = form.activeBidons === '' ? 0 : Number(form.activeBidons);
    const debt = form.debt === '' ? 0 : Number(form.debt);
    const deposit = form.deposit === '' ? 0 : Number(form.deposit);

    if (!form.fullName.trim() || !form.address.trim() || !form.phone.trim()) {
      setToast({ message: 'Ad, telefon və ünvan mütləqdir', type: 'error' });
      return;
    }
    if (isNaN(price) || price <= 0) {
      setToast({ message: 'Qiymət düzgün deyil', type: 'error' });
      return;
    }
    if (isNaN(deposit) || deposit < 0) {
      setToast({ message: 'Depozit 0 və ya daha böyük olmalıdır', type: 'error' });
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
      deposit,
      notes: form.notes,
    });

    setSaving(true);
    try {
      if (editId) {
        const result = await updateCustomer(editId, payload);
        const parts: string[] = ['Müştəri yeniləndi'];
        if (result.debt_payment && parseFloat(String(result.debt_payment.amount)) > 0) {
          parts.push(`Borc ödənişi: ${formatCurrency(result.debt_payment.amount)}`);
        }
        if (result.deposit_entry) {
          const delta = parseMoney(result.deposit_entry.amount);
          parts.push(
            `Depozit: ${formatCurrency(result.deposit_entry.previous_deposit)} → ${formatCurrency(
              result.deposit_entry.new_deposit
            )} (${delta >= 0 ? '+' : ''}${formatCurrency(delta)})`
          );
        }
        setToast({ message: parts.join('. '), type: 'success' });
      } else {
        await createCustomer(payload);
        setToast({ message: 'Yeni müştəri əlavə edildi', type: 'success' });
      }
      onSaved();
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? err.message || 'Bu telefon nömrəsi artıq başqa müştəriyə aid edilib'
          : err instanceof Error
            ? err.message
            : 'Xəta baş verdi';
      setToast({ message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editId ? 'Müştərini redaktə et' : 'Yeni müştəri'}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Ləğv et
            </Button>
            <Button type="submit" form="customer-form" loading={saving} className="w-full sm:w-auto">
              {editId ? 'Yenilə' : 'Əlavə et'}
            </Button>
          </div>
        }
      >
        <form id="customer-form" onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Ad Soyad"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Elcan Həsənli"
              required
            />
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
          <Input
            label="Depozit (₼)"
            type="number"
            min="0"
            step="0.01"
            value={form.deposit}
            onChange={(e) => setForm({ ...form, deposit: e.target.value })}
            placeholder="20"
          />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Qeyd</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Məs: Girişdə 2 bidon — depozit 20"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Müştərinin daimi qeydi (sifariş qeydlərindən ayrıdır)
            </p>
          </div>
          {editId && (
            <p className="text-xs text-slate-500 sm:col-span-2">
              Borc azaldıqda ödənilən məbləğ tarixçədə «Borc ödənişi» kimi qeyd olunur. Depozit
              dəyişikliyi də depozit tarixçəsinə yazılır.
            </p>
          )}
        </form>
      </Modal>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
