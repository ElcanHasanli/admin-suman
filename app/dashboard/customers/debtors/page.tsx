import { DebtorsView } from '@/components/customers/DebtorsView';
import { PageHeader } from '@/components/ui/PageHeader';

export default function DebtorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Borclu müştərilər"
        description="Borc > 0 olan müştərilər — tam və ya qismən ödəniş"
      />
      <DebtorsView />
    </div>
  );
}
