'use client';

import { useEffect, useState } from 'react';
import type { Order } from '@/lib/types';
import { getMarkPaidErrorMessage, markOrderPaid } from '@/lib/api';
import {
  formatCurrency,
  formatMarkPaidSuccessMessage,
  getOrderAmountPaid,
  getOrderCustomerDebt,
  getOrderCustomerName,
  getOrderPrice,
  getOrderRemainingAmount,
} from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type PayMode = 'full' | 'partial';

export function OrderDebtPaymentModal({
  open,
  order,
  onClose,
  onSuccess,
}: {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [mode, setMode] = useState<PayMode>('full');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = order ? getOrderRemainingAmount(order) : 0;
  const price = order ? getOrderPrice(order) : 0;
  const paidSoFar = order ? getOrderAmountPaid(order) : 0;
  const customerDebt = order ? getOrderCustomerDebt(order) : null;

  useEffect(() => {
    if (!open) {
      setMode('full');
      setAmount('');
      setError(null);
      setSaving(false);
    }
  }, [open]);

  if (!order) return null;

  const submitFull = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await markOrderPaid(order.id);
      onSuccess(formatMarkPaidSuccessMessage(res));
      onClose();
    } catch (err) {
      setError(getMarkPaidErrorMessage(err));
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
    if (value > remaining) {
      setError(`Maksimum ${formatCurrency(remaining)} ödənilə bilər`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await markOrderPaid(order.id, { amount: value });
      onSuccess(formatMarkPaidSuccessMessage(res));
      onClose();
    } catch (err) {
      setError(getMarkPaidErrorMessage(err));
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
          Tam ödədi ({formatCurrency(remaining)})
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
          <p className="font-semibold text-slate-900">{getOrderCustomerName(order)}</p>
          {customerDebt != null && (
            <p className="mt-1 text-slate-600">
              Müştəri ümumi borcu:{' '}
              <strong className={customerDebt > 0 ? 'text-red-600' : 'text-slate-800'}>
                {formatCurrency(customerDebt)}
              </strong>
            </p>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-white p-2 ring-1 ring-slate-100">
              <p className="text-slate-400">Qiymət</p>
              <p className="mt-0.5 font-semibold text-slate-900">{formatCurrency(price)}</p>
            </div>
            <div className="rounded-lg bg-white p-2 ring-1 ring-slate-100">
              <p className="text-slate-400">Ödənilib</p>
              <p className="mt-0.5 font-semibold text-emerald-700">{formatCurrency(paidSoFar)}</p>
            </div>
            <div className="rounded-lg bg-white p-2 ring-1 ring-slate-100">
              <p className="text-slate-400">Qalan</p>
              <p className="mt-0.5 font-semibold text-red-600">{formatCurrency(remaining)}</p>
            </div>
          </div>
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
            Tam ödədi
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
            Qismən ödədi
          </button>
        </div>

        {mode === 'partial' && (
          <Input
            label={`Bu dəfə ödənilən məbləğ (max ${formatCurrency(remaining)})`}
            type="number"
            min="0.01"
            step="0.01"
            max={remaining}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Məs: 2.00"
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
