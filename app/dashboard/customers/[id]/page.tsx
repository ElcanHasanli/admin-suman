import { CustomerDetailView } from '@/components/customers/CustomerDetailView';
import { PageHeader } from '@/components/ui/PageHeader';

export function generateStaticParams() {
  return [{ id: '0' }];
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = Number(id);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Müştəri detalı" description={`ID: ${customerId}`} />
      <CustomerDetailView customerId={customerId} />
    </div>
  );
}
