import { HistoryView } from '@/components/history/HistoryView';

export default function HistoryPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tarixçə</h1>
        <p className="mt-1 text-slate-500">Tamamlanmış sifarişlər və gəlir statistikası</p>
      </div>
      <div className="mt-8">
        <HistoryView />
      </div>
    </div>
  );
}
