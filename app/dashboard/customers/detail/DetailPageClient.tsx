'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CustomerDetailView } from '@/components/customers/CustomerDetailView';
import { Button } from '@/components/ui/Button';

export function CustomerDetailPageClient() {
  const searchParams = useSearchParams();
  const raw = searchParams.get('id');
  const customerId = raw != null ? Number(raw) : NaN;

  if (!Number.isFinite(customerId) || customerId <= 0) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-slate-600">Müştəri ID düzgün deyil</p>
        <Link href="/dashboard/customers/">
          <Button variant="secondary">Siyahıya qayıt</Button>
        </Link>
      </div>
    );
  }

  return <CustomerDetailView customerId={customerId} />;
}
