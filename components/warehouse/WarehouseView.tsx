'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  Droplets,
  PackageOpen,
  Users,
  Warehouse,
  Pencil,
} from 'lucide-react';
import {
  getCouriers,
  getMigrationErrorHint,
  getWarehouseSummary,
  getWarehouseUpdates,
  isBackendMigrationError,
  patchWarehouseStock,
} from '@/lib/api';
import type { Courier, WarehousePeriod, WarehouseSummaryResponse, WarehouseUpdate } from '@/lib/types';
import { formatDateTime, formatWarehouseUpdateSummary } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, StatCard } from '@/components/ui/Card';
import { TableScroll } from '@/components/ui/TableScroll';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastType } from '@/components/ui/Toast';

const REFRESH_MS = 30_000;

const periodOptions: { key: WarehousePeriod; label: string }[] = [
  { key: 'today', label: 'Bu gün' },
  { key: 'week', label: 'Bu həftə' },
  { key: 'month', label: 'Bu ay' },
];

export function WarehouseView() {
  const [summary, setSummary] = useState<WarehouseSummaryResponse | null>(null);
  const [updates, setUpdates] = useState<WarehouseUpdate[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [period, setPeriod] = useState<WarehousePeriod>('today');
  const [courierId, setCourierId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_count: '', empty_count: '', notes: '' });
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const cid = courierId ? Number(courierId) : undefined;
        const [summaryData, updatesData] = await Promise.all([
          getWarehouseSummary(),
          getWarehouseUpdates(period, cid),
        ]);
        setSummary(summaryData);
        setUpdates(updatesData);
      } catch (err) {
        setToast({
          message: isBackendMigrationError(err)
            ? getMigrationErrorHint(err)
            : err instanceof Error
              ? err.message
              : 'Anbar məlumatı yüklənə bilmədi',
          type: 'error',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, courierId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void getCouriers()
      .then(setCouriers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => void load(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const openEdit = () => {
    setForm({
      full_count: String(summary?.warehouse.full_count ?? ''),
      empty_count: String(summary?.warehouse.empty_count ?? ''),
      notes: '',
    });
    setEditOpen(true);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const full_count = Number(form.full_count);
    const empty_count = Number(form.empty_count);
    if (!Number.isFinite(full_count) || !Number.isFinite(empty_count)) {
      setToast({ message: 'Dolu və boş say düzgün daxil edin', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const data = await patchWarehouseStock({
        full_count,
        empty_count,
        notes: form.notes.trim() || undefined,
      });
      setSummary(data);
      setEditOpen(false);
      setToast({ message: 'Anbar sayımı yeniləndi', type: 'success' });
      await load(true);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Yeniləmə uğursuz oldu',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const wh = summary?.warehouse;
  const cust = summary?.customers;
  const last = summary?.last_update;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                period === p.key
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Bütün kuryerlər</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.email || `#${c.id}`}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Yenilə
          </Button>
          <Button type="button" onClick={openEdit}>
            <Pencil size={16} />
            Sayım düzəlt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Anbarda dolu bidon"
          value={loading ? '...' : (wh?.full_count ?? 0)}
          icon={<Droplets size={20} />}
          accent="sky"
        />
        <StatCard
          title="Anbarda boş bidon"
          value={loading ? '...' : (wh?.empty_count ?? 0)}
          icon={<PackageOpen size={20} />}
          accent="violet"
        />
        <StatCard
          title="Müştərilərdə cəmi bidon"
          value={loading ? '...' : (cust?.total_active_bidons ?? 0)}
          icon={<Warehouse size={20} />}
          accent="emerald"
        />
        <StatCard
          title="Müştəri sayı"
          value={loading ? '...' : (cust?.customer_count ?? 0)}
          icon={<Users size={20} />}
          accent="amber"
        />
      </div>

      {last && (
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Son yeniləmə
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {last.courier_name || 'Kuryer'} · {formatDateTime(last.created_at)}
          </p>
          <p className="mt-1 text-sm text-slate-600">{formatWarehouseUpdateSummary(last)}</p>
          {last.notes && (
            <p className="mt-2 text-xs text-slate-500">Qeyd: {last.notes}</p>
          )}
        </Card>
      )}

      {wh?.updated_at && (
        <p className="text-xs text-slate-400">
          Anbar stoku: {formatDateTime(wh.updated_at)}
          {wh.updated_by_name ? ` · ${wh.updated_by_name}` : ''}
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="font-semibold text-slate-900">Yeniləmə tarixçəsi</h2>
        </div>
        <TableScroll>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Tarix</th>
                <th className="px-4 py-3">Kuryer</th>
                <th className="px-4 py-3">Boş ↓</th>
                <th className="px-4 py-3">Dolu ↓</th>
                <th className="px-4 py-3">Dolu ↑</th>
                <th className="px-4 py-3">Maşın</th>
                <th className="px-4 py-3">Qaldı (d/b)</th>
                <th className="hidden px-4 py-3 lg:table-cell">Xülasə</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Yüklənir...
                  </td>
                </tr>
              ) : updates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Bu dövr üçün qeyd yoxdur
                  </td>
                </tr>
              ) : (
                updates.map((u, i) => (
                  <tr key={u.id ?? i} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateTime(u.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {u.courier_name || '—'}
                    </td>
                    <td className="px-4 py-3">{u.empty_in}</td>
                    <td className="px-4 py-3">{u.full_in}</td>
                    <td className="px-4 py-3">{u.full_out}</td>
                    <td className="px-4 py-3">{u.exit_full ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {u.remaining_full} / {u.remaining_empty}
                    </td>
                    <td className="hidden max-w-xs px-4 py-3 text-slate-600 lg:table-cell">
                      {formatWarehouseUpdateSummary(u)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Anbar sayımı düzəlt">
        <form onSubmit={handleSaveStock} className="space-y-4">
          <p className="text-sm text-slate-600">
            Sayım səhvi və ya ilk qurulum üçün anbardakı dolu/boş bidon sayını birbaşa
            yeniləyin.
          </p>
          <Input
            label="Dolu bidon"
            type="number"
            min={0}
            value={form.full_count}
            onChange={(e) => setForm((f) => ({ ...f, full_count: e.target.value }))}
            required
          />
          <Input
            label="Boş bidon"
            type="number"
            min={0}
            value={form.empty_count}
            onChange={(e) => setForm((f) => ({ ...f, empty_count: e.target.value }))}
            required
          />
          <Input
            label="Qeyd (istəyə bağlı)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Məs: İnventar sayımı"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saxlanır...' : 'Saxla'}
            </Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
