import { NotificationsView } from '@/components/notifications/NotificationsView';
import { PageHeader } from '@/components/ui/PageHeader';

export default function NotificationsPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Bildirişlər"
        description="Admin xəbərləri — passiv müştəri siyahısı üçün Passiv müştərilər səhifəsinə baxın"
      />
      <NotificationsView />
    </div>
  );
}
