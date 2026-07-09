'use client';

import { useEffect, useState } from 'react';
import type { Customer } from '@/lib/types';
import { getPayDebtErrorMessage, payCustomerDebt } from '@/lib/api';
import { formatCurrency, getCustomerDebt, getCustomerName } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type PayMode = 'full' | 'partial';

export function CustomerPayDebtModal({
  open,
  customer,
  onClose,
  onSuccess,
}: {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [mode, setMode] = useState<PayMode>('full');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debt = customer ? getCustomerDebt(customer) : 0;

  useEffect(() => {
    if (!open) {
      setMode('full');
      setAmount('');
      setError(null);
      setSaving(false);
    }
  }, [open]);

  if (!customer) return null;

  const submitFull = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await payCustomerDebt(customer.id);
      onSuccess(
        `${formatCurrency(res.paid_amount)} ödənildi. Qalan borc: ${formatCurrency(res.customer_debt)}`
      );
      onClose();
    } catch (err) {
      setError(getPayDebtErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submitPartial = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError('Məbləğ düzgün daxil edin');
      return;
    }
    if (value > debt) {
      setError(`Maksimum ${formatCurrency(debt)} ödənilə bilər`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await payCustomerDebt(customer.id, { amount: value });
      onSuccess(
        `${formatCurrency(res.paid_amount)} ödənildi. Qalan borc: ${formatCurrency(res.customer_debt)}`
      );
      onClose();
    } catch (err) {
      setError(getPayDebtErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex flex-col gap-2">
      {mode === 'full' ? (
        <Button
          type="button"
          variant="success"
          loading={saving}
          onClick={() => void submitFull()}
          className="w-full"
        >
          Tam ödə ({formatCurrency(debt)})
        </Button>
      ) : (
        <Button
          type="button"
          variant="success"
          loading={saving}
          onClick={() => void submitPartial()}
          className="w-full"
        >
          Qismən ödənişi təsdiq et
        </Button>
      )}
      <Button type="button" variant="secondary" onClick={onClose} className="w-full" disabled={saving}>
        Ləğv et
      </Button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Borc ödənişi" size="md" footer={footer}>
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-semibold text-slate-900">{getCustomerName(customer)}</p>
          <p className="mt-2 text-slate-600">
            Cari borc:{' '}
            <strong className={debt > 0 ? 'text-red-600' : 'text-slate-800'}>
              {formatCurrency(debt)}
            </strong>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('full')}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              mode === 'full'
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            Tam ödə
          </button>
          <button
            type="button"
            onClick={() => setMode('partial')}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              mode === 'partial'
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            Qismən ödə
          </button>
        </div>

        {mode === 'partial' && (
          <Input
            label={`Bu dəfə ödənilən məbləğ (max ${formatCurrency(debt)})`}
            type="number"
            min="0.01"
            step="0.01"
            max={debt}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Məs: 5.00"
          />
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
