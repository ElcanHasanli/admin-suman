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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const nav = [
  { href: '/dashboard', label: 'İdarə Paneli', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/customers', label: 'Müştərilər', icon: Users },
  { href: '/dashboard/orders', label: 'Sifarişlər', icon: Package },
  { href: '/dashboard/history', label: 'Tarixçə', icon: History },
];

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-800 px-6 py-6">
        <Brand />
        {user?.company_name && (
          <p className="mt-2 truncate text-xs font-medium text-sky-300">{user.company_name}</p>
        )}
        <p className="mt-1 text-xs text-slate-400">Admin Panel</p>
      </div>

      <div className="mx-4 mt-5 rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Daxil olmuş
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-white">
          {user?.name || 'Admin'}
        </p>
        <p className="truncate text-xs text-slate-400">
          {user?.email}
        </p>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
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
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500">
        <Droplets size={22} />
      </div>
      <h1 className="text-xl font-bold tracking-tight">SuMan</h1>
    </div>
  );
}

