'use client';

import { useEffect, useState } from 'react';
import type { HistoryPeriod } from '@/lib/types';
import { getDateRange } from '@/lib/utils';

export const HISTORY_PERIOD_PRESETS: { key: HistoryPeriod; label: string }[] = [
  { key: 'today', label: 'Bu gün' },
  { key: 'yesterday', label: 'Dünən' },
  { key: 'week', label: 'Həftə' },
  { key: 'month', label: 'Ay' },
  { key: 'custom', label: 'Tarix aralığı' },
];

export function HistoryPeriodButtons({
  preset,
  onPresetChange,
}: {
  preset: HistoryPeriod;
  onPresetChange: (p: HistoryPeriod) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      {HISTORY_PERIOD_PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onPresetChange(p.key)}
          className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            preset === p.key
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function useHistoryPeriodState(initial: HistoryPeriod = 'today') {
  const [preset, setPreset] = useState<HistoryPeriod>(initial);
  const today = getDateRange('today');
  const [dateFrom, setDateFrom] = useState(today.from);
  const [dateTo, setDateTo] = useState(today.to);

  useEffect(() => {
    if (preset === 'today' || preset === 'yesterday') {
      const range = getDateRange(preset);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }, [preset]);

  return { preset, setPreset, dateFrom, setDateFrom, dateTo, setDateTo };
}
