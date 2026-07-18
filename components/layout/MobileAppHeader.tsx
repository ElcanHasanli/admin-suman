'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { dashboardNav, isNavActive } from '@/components/layout/dashboard-nav';
import { useAppLayout } from '@/components/layout/useAppLayout';
import { NotificationNavBadge } from '@/components/notifications/NotificationNavBadge';
import { useConfirm } from '@/components/ui/ConfirmModal';

export function MobileAppHeader({ onLogout }: { onLogout: () => void }) {
  const { bottomNav } = useAppLayout();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { requestConfirm, ConfirmDialog } = useConfirm();

  if (!bottomNav) return null;

  const handleLogout = async () => {
    const ok = await requestConfirm({
      title: 'Hesabdan çıxış',
      message: 'Çıxmaq istədiyinizə əminsiniz?',
      confirmLabel: 'Çıxış',
      cancelLabel: 'Qal',
      variant: 'danger',
    });
    if (!ok) return;
    setOpen(false);
    onLogout();
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 border-b border-slate-200/80 bg-slate-100/95 px-4 py-3.5 backdrop-blur-md sm:-mx-6 sm:px-6"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm ring-1 ring-slate-200"
          aria-label="Menyu"
        >
          <Menu size={20} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <BrandLogo size="sm" className="shrink-0" />
          <p className="min-w-0 truncate text-[11px] text-slate-500">
            {user?.name || user?.email}
          </p>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] flex">
          <button
            type="button"
            className="flex-1 bg-slate-900/40"
            aria-label="Menyunu bağla"
            onClick={() => setOpen(false)}
          />
          <aside className="flex h-full w-[min(280px,85vw)] flex-col bg-slate-900 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
                aria-label="Bağla"
              >
                <X size={20} />
              </button>
            </div>

            {user?.company_name && (
              <p className="mx-3 mt-3 truncate rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-sky-300">
                {user.company_name}
              </p>
            )}

            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
              {dashboardNav.map((item) => {
                const active = isNavActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="relative shrink-0">
                      <Icon size={18} />
                      {item.href === '/dashboard/notifications' && <NotificationNavBadge />}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-800 p-3">
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                <LogOut size={18} />
                Çıxış
              </button>
            </div>
          </aside>
        </div>
      )}

      {ConfirmDialog}
    </>
  );
}
