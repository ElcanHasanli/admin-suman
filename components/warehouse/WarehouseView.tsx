'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  patchCourierWarehouse,
  patchWarehouseStock,
} from '@/lib/api';
import type {
  Courier,
  DateRangePreset,
  WarehouseCode,
  WarehouseStock,
  WarehouseSummaryResponse,
  WarehouseUpdate,
} from '@/lib/types';
import {
  formatDateTime,
  formatWarehouseUpdateSummary,
  getCourierDefaultWarehouse,
  getCourierName,
  getWarehouseCode,
  getWarehouseLabel,
  getWarehouseName,
  normalizeWarehousesList,
  resolveApiPeriodParams,
} from '@/lib/utils';
import {
  DateRangePresetButtons,
  useDateRangeState,
} from '@/components/ui/DateRangePresets';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, StatCard } from '@/components/ui/Card';
import { TableScroll } from '@/components/ui/TableScroll';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastType } from '@/components/ui/Toast';
import { MobileOnly, DesktopOnly } from '@/components/ui/ResponsiveViews';
import {
  MobileCard,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
  MobileCardTitle,
  MobileEmpty,
} from '@/components/ui/MobileCards';

const REFRESH_MS = 30_000;

const WAREHOUSE_OPTIONS: { code: WarehouseCode; label: string }[] = [
  { code: 'novxani', label: 'Novxanı' },
  { code: 'azadliq', label: 'Azadlıq' },
];

export function WarehouseView() {
  const [summary, setSummary] = useState<WarehouseSummaryResponse | null>(null);
  const [updates, setUpdates] = useState<WarehouseUpdate[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const { preset, setPreset, dateFrom, setDateFrom, dateTo, setDateTo } =
    useDateRangeState('today');
  const [courierId, setCourierId] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<'' | WarehouseCode>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    warehouse_code: 'novxani' as WarehouseCode,
    full_count: '',
    empty_count: '',
    notes: '',
  });
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [savingCourierId, setSavingCourierId] = useState<number | null>(null);

  const warehouses = useMemo(() => normalizeWarehousesList(summary), [summary]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const cid = courierId ? Number(courierId) : undefined;
        const { period, startDate, endDate } = resolveApiPeriodParams(
          preset,
          dateFrom,
          dateTo
        );
        const [summaryData, updatesData] = await Promise.all([
          getWarehouseSummary(),
          getWarehouseUpdates(
            period,
            cid,
            startDate,
            endDate,
            warehouseFilter || undefined
          ),
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
    [preset, dateFrom, dateTo, courierId, warehouseFilter]
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

  const openEdit = (w?: WarehouseStock) => {
    const target =
      w ??
      warehouses.find((x) => getWarehouseCode(x) === warehouseFilter) ??
      warehouses[0];
    const code = (getWarehouseCode(target) || 'novxani') as WarehouseCode;
    setForm({
      warehouse_code: code === 'azadliq' ? 'azadliq' : 'novxani',
      full_count: String(target?.full_count ?? ''),
      empty_count: String(target?.empty_count ?? ''),
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
      const payload: Parameters<typeof patchWarehouseStock>[0] = {
        warehouse_code: form.warehouse_code,
        full_count,
        empty_count,
        notes: form.notes.trim() || undefined,
      };
      const data = await patchWarehouseStock(payload);
      setSummary(data);
      setEditOpen(false);
      setToast({
        message: `${getWarehouseLabel(form.warehouse_code)} sayımı yeniləndi`,
        type: 'success',
      });
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

  const handleCourierWarehouse = async (courier: Courier, code: string) => {
    setSavingCourierId(courier.id);
    try {
      const updated = await patchCourierWarehouse(courier.id, code);
      setCouriers((prev) =>
        prev.map((c) =>
          c.id === courier.id
            ? {
                ...c,
                ...updated,
                default_warehouse: code,
                default_warehouse_code: code,
                default_warehouse_name: getWarehouseLabel(code),
              }
            : c
        )
      );
      setToast({
        message: `${getCourierName(courier)} → ${getWarehouseLabel(code)}`,
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Kuryer anbarı yenilənmədi',
        type: 'error',
      });
    } finally {
      setSavingCourierId(null);
    }
  };

  const cust = summary?.customers;
  const last = summary?.last_update;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangePresetButtons
          preset={preset as DateRangePreset}
          onPresetChange={setPreset}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={warehouseFilter}
            onChange={(e) =>
              setWarehouseFilter((e.target.value || '') as '' | WarehouseCode)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Bütün anbarlar</option>
            {WAREHOUSE_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Bütün kuryerlər</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {getCourierName(c)}
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
          <Button type="button" onClick={() => openEdit()}>
            <Pencil size={16} />
            Sayım düzəlt
          </Button>
        </div>
      </div>

      {preset === 'custom' && (
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <Input
              label="Başlanğıc tarixi"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              label="Son tarix"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void load()}
              className="w-full sm:w-auto"
            >
              Tətbiq et
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {(loading && warehouses.length === 0
          ? WAREHOUSE_OPTIONS.map((o) => ({
              warehouse_code: o.code,
              name: o.label,
              full_count: 0,
              empty_count: 0,
            }))
          : warehouses
        ).map((w) => (
          <WarehouseLocationCard
            key={getWarehouseCode(w) || getWarehouseName(w)}
            warehouse={w}
            loading={loading}
            onEdit={() => openEdit(w)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
            {formatDateTime(last.created_at)}
          </p>
          <p className="mt-1 text-sm text-slate-600">{formatWarehouseUpdateSummary(last)}</p>
          {last.notes && (
            <p className="mt-2 text-xs text-slate-500">Qeyd: {last.notes}</p>
          )}
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="font-semibold text-slate-900">Yeniləmə tarixçəsi</h2>
        </div>
        <MobileOnly>
          <div className="p-3">
            {loading ? (
              <MobileEmpty>Yüklənir...</MobileEmpty>
            ) : updates.length === 0 ? (
              <MobileEmpty>Bu dövr üçün qeyd yoxdur</MobileEmpty>
            ) : (
              <MobileCardList>
                {updates.map((u, i) => (
                  <MobileCard key={u.id ?? i}>
                    <MobileCardTitle
                      subtitle={u.warehouse_name || getWarehouseLabel(u.warehouse_code)}
                    >
                      {u.courier_name || 'Kuryer'}
                    </MobileCardTitle>
                    <p className="text-xs text-slate-400">{formatDateTime(u.created_at)}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formatWarehouseUpdateSummary(u)}
                    </p>
                    {u.notes && (
                      <p className="mt-2 text-xs text-slate-500">Qeyd: {u.notes}</p>
                    )}
                    <MobileCardGrid className="mt-3">
                      <MobileCardField
                        label="Girdi dolu"
                        value={u.entry_full ?? u.full_in ?? 0}
                      />
                      <MobileCardField
                        label="Girdi boş"
                        value={u.entry_empty ?? u.empty_in ?? 0}
                      />
                      <MobileCardField
                        label="Çıxdı dolu"
                        value={u.exit_full ?? u.full_out ?? 0}
                      />
                      <MobileCardField
                        label="Götürdü"
                        value={
                          u.full_taken ??
                          Math.max(
                            0,
                            (u.exit_full ?? u.full_out ?? 0) -
                              (u.entry_full ?? u.full_in ?? 0)
                          )
                        }
                      />
                    </MobileCardGrid>
                  </MobileCard>
                ))}
              </MobileCardList>
            )}
          </div>
        </MobileOnly>
        <DesktopOnly>
          <TableScroll>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tarix</th>
                  <th className="px-4 py-3">Kuryer</th>
                  <th className="px-4 py-3">Anbar</th>
                  <th className="px-4 py-3">Girdi (d/b)</th>
                  <th className="px-4 py-3">Çıxdı</th>
                  <th className="px-4 py-3">Götürdü</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Xülasə</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Yüklənir...
                    </td>
                  </tr>
                ) : updates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Bu dövr üçün qeyd yoxdur
                    </td>
                  </tr>
                ) : (
                  updates.map((u, i) => {
                    const entryFull = u.entry_full ?? u.full_in ?? 0;
                    const entryEmpty = u.entry_empty ?? u.empty_in ?? 0;
                    const exitFull = u.exit_full ?? u.full_out ?? 0;
                    const taken =
                      u.full_taken ?? Math.max(0, exitFull - entryFull);
                    return (
                      <tr key={u.id ?? i} className="hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatDateTime(u.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {u.courier_name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {u.warehouse_name || getWarehouseLabel(u.warehouse_code)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {entryFull} / {entryEmpty}
                        </td>
                        <td className="px-4 py-3">{exitFull}</td>
                        <td className="px-4 py-3 font-medium">{taken}</td>
                        <td className="hidden max-w-xs px-4 py-3 text-slate-600 lg:table-cell">
                          {formatWarehouseUpdateSummary(u)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableScroll>
        </DesktopOnly>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="font-semibold text-slate-900">Kuryer default anbarı</h2>
          <p className="mt-1 text-xs text-slate-500">
            Hər kuryerin əsas məntəqəsi — Novxanı və ya Azadlıq
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {couriers.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 sm:px-5">Kuryer yoxdur</p>
          ) : (
            couriers.map((c) => {
              const current = getCourierDefaultWarehouse(c) || '';
              return (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div>
                    <p className="font-medium text-slate-900">{getCourierName(c)}</p>
                    <p className="text-xs text-slate-500">
                      {current
                        ? getWarehouseLabel(current)
                        : 'Default anbar seçilməyib'}
                    </p>
                  </div>
                  <select
                    value={current}
                    disabled={savingCourierId === c.id}
                    onChange={(e) => {
                      if (e.target.value) {
                        void handleCourierWarehouse(c, e.target.value);
                      }
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-60"
                  >
                    <option value="">Seçin...</option>
                    {WAREHOUSE_OPTIONS.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Anbar sayımı düzəlt"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditOpen(false)}
              className="w-full sm:w-auto"
            >
              Ləğv et
            </Button>
            <Button
              type="submit"
              form="warehouse-stock-form"
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? 'Saxlanır...' : 'Saxla'}
            </Button>
          </div>
        }
      >
        <form id="warehouse-stock-form" onSubmit={handleSaveStock} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Anbar
            </label>
            <select
              value={form.warehouse_code}
              onChange={(e) => {
                const code = e.target.value as WarehouseCode;
                const existing = warehouses.find((w) => getWarehouseCode(w) === code);
                setForm((f) => ({
                  ...f,
                  warehouse_code: code,
                  full_count: String(existing?.full_count ?? f.full_count),
                  empty_count: String(existing?.empty_count ?? f.empty_count),
                }));
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              {WAREHOUSE_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
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
        </form>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

function WarehouseLocationCard({
  warehouse,
  loading,
  onEdit,
}: {
  warehouse: WarehouseStock;
  loading: boolean;
  onEdit: () => void;
}) {
  const name = getWarehouseName(warehouse);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div>
          <h2 className="font-semibold text-slate-900">{name}</h2>
          {warehouse.updated_at && (
            <p className="mt-0.5 text-xs text-slate-400">
              {formatDateTime(warehouse.updated_at)}
              {warehouse.updated_by_name ? ` · ${warehouse.updated_by_name}` : ''}
            </p>
          )}
        </div>
        <Button type="button" variant="secondary" onClick={onEdit} className="text-xs">
          <Pencil size={14} />
          Düzəlt
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
        <MiniStat
          label="Dolu"
          value={loading ? '...' : warehouse.full_count}
          icon={<Droplets size={16} />}
          tone="sky"
        />
        <MiniStat
          label="Boş"
          value={loading ? '...' : warehouse.empty_count}
          icon={<PackageOpen size={16} />}
          tone="violet"
        />
      </div>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: 'sky' | 'violet';
}) {
  const tones = {
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return (
    <div className={`rounded-xl p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-80">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
