import { HistoryView } from '@/components/history/HistoryView';
import { PageHeader } from '@/components/ui/PageHeader';

export default function HistoryPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Tarixçə"
        description="Tamamlanmış sifarişlər və gəlir statistikası"
      />
      <HistoryView />
    </div>
  );
}
