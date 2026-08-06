import { InactiveCustomersView } from '@/components/customers/InactiveCustomersView';
import { PageHeader } from '@/components/ui/PageHeader';

export default function InactiveCustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Problemli müştərilər"
        description="Son 30 gün sifariş verməyən və qalıq bidonu olan müştərilər"
      />
      <InactiveCustomersView />
    </div>
  );
}
