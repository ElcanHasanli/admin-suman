import { WarehouseView } from '@/components/warehouse/WarehouseView';
import { PageHeader } from '@/components/ui/PageHeader';

export default function WarehousePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Su doldurma anbarı"
        description="Kuryer yeniləmələri real vaxtda · hər 30 saniyədə avtomatik yenilənir"
      />
      <WarehouseView />
    </div>
  );
}
