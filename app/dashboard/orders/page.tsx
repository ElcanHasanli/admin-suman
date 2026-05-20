import { OrdersView } from '@/components/orders/OrdersView';

export default function OrdersPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sifarişlər</h1>
        <p className="mt-1 text-slate-500">Sifariş yaratma, redaktə və tamamlama</p>
      </div>
      <div className="mt-8">
        <OrdersView />
      </div>
    </div>
  );
}
