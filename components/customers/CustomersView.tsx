'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Download, Search, ChevronRight } from 'lucide-react';
import {
  CUSTOMERS_DEFAULT_PAGE_SIZE,
  deleteCustomer,
  exportCustomersExcel,
  getCustomers,
} from '@/lib/api';
import type { Customer } from '@/lib/types';
import {
  downloadBlob,
  getExportErrorMessage,
  getExportSuccessMessage,
} from '@/lib/download';
import {
  formatCurrency,
  formatLocalDate,
  getCustomerActiveBidons,
  getCustomerDebt,
  getCustomerName,
  getCustomerPhone,
  getCustomerPrice,
  truncateAddress,
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TableScroll } from '@/components/ui/TableScroll';
import { Toast, ToastType } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
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

export function CustomersView() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const { requestConfirm, ConfirmDialog } = useConfirm();

  const showToast = (message: string, type: ToastType = 'info') =>
    setToast({ message, type });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomers({
        page,
        limit: CUSTOMERS_DEFAULT_PAGE_SIZE,
        q: debouncedSearch || undefined,
      });
      setCustomers(data.customers);
      setTotal(data.total);

      const maxPage = Math.max(1, Math.ceil(data.total / CUSTOMERS_DEFAULT_PAGE_SIZE));
      if (page > maxPage && maxPage >= 1) {
        setPage(maxPage);
      }
    } catch {
      showToast('Müştərilər yüklənə bilmədi', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditCustomer(null);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setModalOpen(true);
  };

  const openDetail = (id: number) => {
    router.push(`/dashboard/customers/detail/?id=${id}`);
  };

  const handleExport = async () => {
    try {
      const blob = await exportCustomersExcel();
      await downloadBlob(blob, `musteriler_${formatLocalDate()}.xlsx`);
      showToast(getExportSuccessMessage(), 'success');
    } catch (err) {
      showToast(getExportErrorMessage(err), 'error');
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

  return (
    <div className="space-y-6">
      <Toolbar
        search={search}
        onSearch={setSearch}
        onExport={handleExport}
        onCreate={openCreate}
      />

      <Card className="overflow-hidden">
        <MobileOnly>
          <div className="p-3">
            {loading ? (
              <MobileEmpty>Yüklənir...</MobileEmpty>
            ) : customers.length === 0 ? (
              <MobileEmpty>Müştəri tapılmadı</MobileEmpty>
            ) : (
              <MobileCardList>
                {customers.map((c) => (
                  <MobileCard key={c.id} onClick={() => openDetail(c.id)}>
                    <MobileCardTitle subtitle={getCustomerPhone(c) || undefined}>
                      {getCustomerName(c)}
                    </MobileCardTitle>
                    <MobileCardGrid>
                      <MobileCardField
                        label="Qiymət"
                        value={formatCurrency(getCustomerPrice(c))}
                      />
                      <MobileCardField label="Bidon" value={getCustomerActiveBidons(c)} />
                      <MobileCardField
                        label="Borc"
                        value={formatCurrency(getCustomerDebt(c))}
                        valueClassName={getCustomerDebt(c) > 0 ? 'text-red-600' : ''}
                      />
                    </MobileCardGrid>
                    {c.address && (
                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {c.address}
                      </p>
                    )}
                    <MobileCardActions>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(c.id);
                        }}
                        className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700"
                      >
                        Detallar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(c);
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        Redaktə
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id, getCustomerName(c));
                        }}
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
          <CustomersTable
            loading={loading}
            customers={customers}
            onDetail={openDetail}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </DesktopOnly>
        {!loading && total > 0 && (
          <CustomersPagination
            page={page}
            totalItems={total}
            pageSize={CUSTOMERS_DEFAULT_PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </Card>

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editCustomer}
        onSaved={load}
      />

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

function CustomersPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-slate-500">
        {from}–{to} / {totalItems} müştəri · Səhifə {page} / {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex-1 sm:flex-none"
        >
          Əvvəlki
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex-1 sm:flex-none"
        >
          Növbəti
        </Button>
      </div>
    </div>
  );
}

function CustomersTable({
  loading,
  customers,
  onDetail,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  customers: Customer[];
  onDetail: (id: number) => void;
  onEdit: (c: Customer) => void;
  onDelete: (id: number, name: string) => void;
}) {
  return (
    <TableScroll minWidth={760}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Ad</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Telefon</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Ünvan</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Qiymət</th>
            <th className="px-3 py-2.5 sm:px-5 sm:py-3">Bidon</th>
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
              <tr
                key={c.id}
                onClick={() => onDetail(c.id)}
                className="cursor-pointer border-b border-slate-50 transition hover:bg-sky-50/40"
              >
                <td className="px-3 py-3 font-medium text-slate-900 sm:px-5 sm:py-3.5">
                  {getCustomerName(c)}
                </td>
                <td className="px-3 py-3 text-slate-600 sm:px-5 sm:py-3.5">
                  {getCustomerPhone(c) || '—'}
                </td>
                <td className="max-w-[160px] px-3 py-3 sm:max-w-[220px] sm:px-5 sm:py-3.5">
                  <span className="line-clamp-2 text-slate-600" title={c.address}>
                    {truncateAddress(c.address, 56)}
                  </span>
                </td>
                <td className="px-3 py-3 font-medium sm:px-5 sm:py-3.5">
                  {formatCurrency(getCustomerPrice(c))}
                </td>
                <td className="px-3 py-3 font-semibold text-sky-700 sm:px-5 sm:py-3.5">
                  {getCustomerActiveBidons(c)}
                </td>
                <td
                  className={`px-3 py-3 font-semibold sm:px-5 sm:py-3.5 ${
                    getCustomerDebt(c) > 0 ? 'text-red-600' : 'text-slate-600'
                  }`}
                >
                  {formatCurrency(getCustomerDebt(c))}
                </td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onDetail(c.id)}
                      className="rounded-lg px-2 py-2 text-xs font-medium text-sky-600 hover:bg-sky-50"
                    >
                      Detallar
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-600"
                      title="Redaktə"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id, getCustomerName(c))}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="hidden text-slate-300 sm:block" />
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
