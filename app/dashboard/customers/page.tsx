import { Suspense } from 'react';
import { CustomersPageClient } from '@/app/dashboard/customers/CustomersPageClient';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CustomersPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Müştərilər"
        description="Elifba sırası — ad, telefon, ünvan və qiymətə görə filter"
      />
      <Suspense fallback={<p className="py-8 text-center text-slate-500">Yüklənir...</p>}>
        <CustomersPageClient />
      </Suspense>
    </div>
  );
}
