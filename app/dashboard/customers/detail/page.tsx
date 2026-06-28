import { Suspense } from 'react';
import { CustomerDetailPageClient } from '@/app/dashboard/customers/detail/DetailPageClient';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CustomerDetailPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Müştəri detalı" description="Tam məlumat və tarixçə" />
      <Suspense fallback={<p className="py-8 text-center text-slate-500">Yüklənir...</p>}>
        <CustomerDetailPageClient />
      </Suspense>
    </div>
  );
}
