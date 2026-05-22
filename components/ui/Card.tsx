export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'sky',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'sky' | 'violet' | 'emerald' | 'amber' | 'rose';
}) {
  const accents = {
    sky: 'from-sky-500 to-cyan-500',
    violet: 'from-violet-500 to-purple-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <StatContent title={title} value={value} subtitle={subtitle} />
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accents[accent]} text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function StatContent({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
