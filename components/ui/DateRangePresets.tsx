'use client';

import { useEffect, useState } from 'react';
import type { DateRangePreset } from '@/lib/types';
import { getDateRange } from '@/lib/utils';

export const DATE_RANGE_PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: 'yesterday', label: 'Dünən' },
  { key: 'today', label: 'Bu gün' },
  { key: 'custom', label: 'Tarix aralığı' },
];

export function DateRangePresetButtons({
  preset,
  onPresetChange,
}: {
  preset: DateRangePreset;
  onPresetChange: (p: DateRangePreset) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      {DATE_RANGE_PRESETS.map((p) => (
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

export function useDateRangeState(initial: DateRangePreset = 'today') {
  const [preset, setPreset] = useState<DateRangePreset>(initial);
  const today = getDateRange('today');
  const [dateFrom, setDateFrom] = useState(today.from);
  const [dateTo, setDateTo] = useState(today.to);

  useEffect(() => {
    if (preset !== 'custom') {
      const range = getDateRange(preset);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }, [preset]);

  return { preset, setPreset, dateFrom, setDateFrom, dateTo, setDateTo };
}
