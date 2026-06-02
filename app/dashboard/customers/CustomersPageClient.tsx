'use client';

import { useSearchParams } from 'next/navigation';
import { CustomersView } from '@/components/customers/CustomersView';

export function CustomersPageClient() {
  const searchParams = useSearchParams();
  const raw = searchParams.get('customer_id');
  const parsed = raw != null ? Number(raw) : NaN;
  const highlightCustomerId = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  return <CustomersView highlightCustomerId={highlightCustomerId} />;
}
