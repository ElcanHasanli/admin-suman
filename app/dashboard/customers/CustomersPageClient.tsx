'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomersView } from '@/components/customers/CustomersView';

export function CustomersPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyId = searchParams.get('customer_id');

  useEffect(() => {
    if (!legacyId) return;
    const id = Number(legacyId);
    if (Number.isFinite(id) && id > 0) {
      router.replace(`/dashboard/customers/detail/?id=${id}`);
    }
  }, [legacyId, router]);

  if (legacyId) {
    return <p className="py-8 text-center text-slate-500">Yönləndirilir...</p>;
  }

  return <CustomersView />;
}
