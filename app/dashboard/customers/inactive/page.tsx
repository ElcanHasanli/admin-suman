import { InactiveCustomersView } from '@/components/customers/InactiveCustomersView';
import { PageHeader } from '@/components/ui/PageHeader';

export default function InactiveCustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Passiv müştərilər"
        description="Seçilmiş tarix aralığında sifariş verməyən və qalıq bidonu olan müştərilər"
      />
      <InactiveCustomersView />
    </div>
  );
}
