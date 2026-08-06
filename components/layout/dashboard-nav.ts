import {
  LayoutDashboard,
  Users,
  Package,
  History,
  Warehouse,
  Bell,
  CircleDollarSign,
  UserX,
  type LucideIcon,
} from 'lucide-react';

export type DashboardNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  exact?: boolean;
};

const CUSTOMER_SUBPATHS = [
  '/dashboard/customers/debtors',
  '/dashboard/customers/inactive',
] as const;

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
    href: '/dashboard/customers/inactive',
    label: 'Problemli müştərilər',
    shortLabel: 'Problemli',
    icon: UserX,
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
    if (pathname === '/dashboard/customers') return true;
    if (!pathname.startsWith('/dashboard/customers/')) return false;
    return !CUSTOMER_SUBPATHS.some((p) => pathname.startsWith(p));
  }
  if (item.href === '/dashboard/customers/debtors') {
    return pathname.startsWith('/dashboard/customers/debtors');
  }
  if (item.href === '/dashboard/customers/inactive') {
    return pathname.startsWith('/dashboard/customers/inactive');
  }
  return pathname.startsWith(item.href);
}
