const styles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  assigned: 'bg-violet-50 text-violet-700 ring-violet-200',
  progress: 'bg-blue-50 text-blue-700 ring-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  default: 'bg-slate-50 text-slate-600 ring-slate-200',
};

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: keyof typeof styles;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[variant] || styles.default}`}
    >
      {children}
    </span>
  );
}

export function orderStatusVariant(status?: string): keyof typeof styles {
  switch ((status || '').toLowerCase()) {
    case 'completed':
      return 'completed';
    case 'in_progress':
      return 'progress';
    case 'assigned':
      return 'assigned';
    case 'pending':
      return 'pending';
    default:
      return 'default';
  }
}
