import {
  LayoutDashboard,
  Users,
  Package,
  History,
  Warehouse,
  Bell,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react';

export type DashboardNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const dashboardNav: DashboardNavItem[] = [
  {
    href: '/dashboard',
    label: 'İdarə Paneli',
    shortLabel: 'Panel',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/dashboard/notifications',
    label: 'Bildirişlər',
    shortLabel: 'Bildiriş',
    icon: Bell,
  },
  {
    href: '/dashboard/warehouse',
    label: 'Anbar',
    shortLabel: 'Anbar',
    icon: Warehouse,
  },
  {
    href: '/dashboard/customers',
    label: 'Müştərilər',
    shortLabel: 'Müştəri',
    icon: Users,
  },
  {
    href: '/dashboard/customers/debtors',
    label: 'Borclu müştərilər',
    shortLabel: 'Borclu',
    icon: CircleDollarSign,
  },
  {
    href: '/dashboard/orders',
    label: 'Sifarişlər',
    shortLabel: 'Sifariş',
    icon: Package,
  },
  {
    href: '/dashboard/history',
    label: 'Tarixçə',
    shortLabel: 'Tarixçə',
    icon: History,
  },
];

export function isNavActive(
  pathname: string,
  item: DashboardNavItem
): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  if (item.href === '/dashboard/customers') {
    return (
      pathname === '/dashboard/customers' ||
      (pathname.startsWith('/dashboard/customers/') &&
        !pathname.startsWith('/dashboard/customers/debtors'))
    );
  }
  if (item.href === '/dashboard/customers/debtors') {
    return pathname.startsWith('/dashboard/customers/debtors');
  }
  return pathname.startsWith(item.href);
}
