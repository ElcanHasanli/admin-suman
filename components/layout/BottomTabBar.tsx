'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dashboardNav, isNavActive } from '@/components/layout/dashboard-nav';
import { NotificationNavBadge } from '@/components/notifications/NotificationNavBadge';

export function BottomTabBar() {
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
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition ${
                active
                  ? 'text-sky-600'
                  : 'text-slate-500 active:bg-slate-100'
              }`}
            >
              <span className="relative shrink-0">
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {item.href === '/dashboard/notifications' && <NotificationNavBadge />}
              </span>
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
      </div>
    </nav>
  );
}
