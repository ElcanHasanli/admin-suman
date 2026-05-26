import {
  LayoutDashboard,
  Users,
  Package,
  History,
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
    href: '/dashboard/customers',
    label: 'Müştərilər',
    shortLabel: 'Müştəri',
    icon: Users,
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
  return item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);
}
