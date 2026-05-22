import { CustomersView } from '@/components/customers/CustomersView';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CustomersPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Müştərilər"
        description="Müştəri siyahısı və idarəetmə"
      />
      <CustomersView />
    </div>
  );
}
