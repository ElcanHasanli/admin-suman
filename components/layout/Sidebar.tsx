'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  History,
  LogOut,
  Droplets,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const nav = [
  { href: '/dashboard', label: 'İdarə Paneli', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/customers', label: 'Müştərilər', icon: Users },
  { href: '/dashboard/orders', label: 'Sifarişlər', icon: Package },
  { href: '/dashboard/history', label: 'Tarixçə', icon: History },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ open, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-[min(280px,88vw)] max-w-[280px] flex-col bg-slate-900 text-white shadow-xl transition-transform duration-300 ease-out lg:w-[260px] lg:max-w-none lg:translate-x-0 lg:shadow-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-5 sm:px-6">
        <Brand />
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Menyunu bağla"
        >
          <X size={20} />
        </button>
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
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
        >
          <LogOut size={18} />
          Çıxış
        </button>
      </div>
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
        <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">SuMan</h1>
        <p className="text-xs text-slate-400">Admin Panel</p>
      </div>
    </div>
  );
}
