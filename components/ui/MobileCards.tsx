'use client';

export function MobileCardList({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`space-y-3 ${className}`}>{children}</div>;
}

export function MobileCard({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:bg-slate-50 ${className}`}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function MobileCardTitle({
  children,
  badge,
  subtitle,
}: {
  children: React.ReactNode;
  badge?: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-slate-900">{children}</h3>
        {badge}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function MobileCardGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`grid grid-cols-2 gap-x-4 gap-y-3 text-sm ${className}`}>{children}</div>;
}

export function MobileCardField({
  label,
  value,
  className = '',
  valueClassName = '',
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className={`mt-0.5 break-words text-sm font-medium text-slate-800 ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}

export function MobileCardActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
      {children}
    </div>
  );
}

export function MobileEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center text-sm text-slate-400">
      {children}
    </p>
  );
}
