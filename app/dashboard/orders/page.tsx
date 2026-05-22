import { OrdersView } from '@/components/orders/OrdersView';
import { PageHeader } from '@/components/ui/PageHeader';

export default function OrdersPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Sifarişlər"
        description="Sifariş yaratma, redaktə və tamamlama"
      />
      <OrdersView />
    </div>
  );
}
