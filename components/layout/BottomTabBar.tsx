'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { dashboardNav, isNavActive } from '@/components/layout/dashboard-nav';

export function BottomTabBar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      data-bottom-nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Əsas naviqasiya"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {dashboardNav.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition ${
                active
                  ? 'text-sky-600'
                  : 'text-slate-500 active:bg-slate-100'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                className="shrink-0"
              />
              <span
                className={`max-w-full truncate text-[10px] font-medium leading-tight ${
                  active ? 'font-semibold' : ''
                }`}
              >
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onLogout}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-slate-500 transition active:bg-red-50 active:text-red-600"
          aria-label="Çıxış"
        >
          <LogOut size={22} className="shrink-0" />
          <span className="text-[10px] font-medium leading-tight">Çıxış</span>
        </button>
      </div>
    </nav>
  );
}
