import { CustomersView } from '@/components/customers/CustomersView';

export default function CustomersPage() {
  return (
    <div>
      <PageHeader title="Müştərilər" subtitle="Müştəri siyahısı və idarəetmə" />
      <div className="mt-8">
        <CustomersView />
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1 text-slate-500">{subtitle}</p>
    </div>
  );
}
