'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { useAppLayout } from '@/components/layout/useAppLayout';

export function DashboardShell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const { bottomNav, sidebar } = useAppLayout();

  return (
    <div className="min-h-screen bg-slate-100">
      {sidebar && <Sidebar onLogout={onLogout} />}

      <div
        className={`flex min-h-screen min-w-0 flex-col ${
          sidebar ? 'lg:pl-[260px]' : ''
        }`}
      >
        <main
          className={[
            'min-w-0 flex-1 p-4 sm:p-6',
            bottomNav &&
              'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]',
            !bottomNav && 'lg:p-8',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children}
        </main>
      </div>

      {bottomNav && <BottomTabBar onLogout={onLogout} />}
    </div>
  );
}
