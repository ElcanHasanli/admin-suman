'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Droplets } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dashboardNav, isNavActive } from '@/components/layout/dashboard-nav';
import { NotificationNavBadge } from '@/components/notifications/NotificationNavBadge';
import { useConfirm } from '@/components/ui/ConfirmModal';

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const { requestConfirm, ConfirmDialog } = useConfirm();
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-800 px-6 py-5">
        <Brand />
      </div>

      {user?.company_name && (
        <p className="mx-4 mt-4 truncate rounded-lg bg-slate-800/60 px-3 py-2 text-xs font-medium text-sky-300">
          {user.company_name}
        </p>
      )}

      <div className="mx-4 mt-4 rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Daxil olmuş
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-white">
          {user?.name || 'Admin'}
        </p>
        <p className="truncate text-xs text-slate-400">{user?.email}</p>
      </div>

      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {dashboardNav.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
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

      <div className="border-t border-slate-800 p-4">
        <button
          type="button"
          onClick={() => {
            void (async () => {
              const ok = await requestConfirm({
                title: 'Hesabdan çıxış',
                message: 'Çıxmaq istədiyinizə əminsiniz?',
                confirmLabel: 'Çıxış',
                cancelLabel: 'Qal',
                variant: 'danger',
              });
              if (ok) onLogout();
            })();
          }}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
        >
          <LogOut size={18} />
          Çıxış
        </button>
      </div>
      {ConfirmDialog}
    </aside>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500">
        <Droplets size={22} />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight">SuMan</h1>
        <p className="text-xs text-slate-400">Admin Panel</p>
      </div>
    </div>
  );
}
