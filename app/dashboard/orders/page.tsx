import { Suspense } from 'react';
import { OrdersPageClient } from '@/app/dashboard/orders/OrdersPageClient';
import { PageHeader } from '@/components/ui/PageHeader';

export default function OrdersPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Sifarişlər"
        description="Sifariş yaratma, redaktə və tamamlama"
      />
      <Suspense fallback={<p className="py-8 text-center text-slate-500">Yüklənir...</p>}>
        <OrdersPageClient />
      </Suspense>
    </div>
  );
}
