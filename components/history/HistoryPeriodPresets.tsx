'use client';

import { useEffect, useState } from 'react';
import type { DailyHistoryPeriod, MonthlyHistoryPeriod } from '@/lib/types';
import { formatLocalDate, getDateRange } from '@/lib/utils';

export const DAILY_PERIOD_PRESETS: { key: DailyHistoryPeriod; label: string }[] = [
  { key: 'today', label: 'Bu gün' },
  { key: 'yesterday', label: 'Dünən' },
  { key: 'custom', label: 'Tarix' },
];

export const MONTHLY_PERIOD_PRESETS: { key: MonthlyHistoryPeriod; label: string }[] = [
  { key: 'days2', label: '2 gün' },
  { key: 'week', label: 'Həftə' },
  { key: 'month', label: 'Bu ay' },
  { key: 'custom', label: 'Aralıq' },
];

function PeriodButtons<T extends string>({
  presets,
  preset,
  onPresetChange,
}: {
  presets: { key: T; label: string }[];
  preset: T;
  onPresetChange: (p: T) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      {presets.map((p) => (
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

export function DailyPeriodButtons({
  preset,
  onPresetChange,
}: {
  preset: DailyHistoryPeriod;
  onPresetChange: (p: DailyHistoryPeriod) => void;
}) {
  return (
    <PeriodButtons
      presets={DAILY_PERIOD_PRESETS}
      preset={preset}
      onPresetChange={onPresetChange}
    />
  );
}

export function MonthlyPeriodButtons({
  preset,
  onPresetChange,
}: {
  preset: MonthlyHistoryPeriod;
  onPresetChange: (p: MonthlyHistoryPeriod) => void;
}) {
  return (
    <PeriodButtons
      presets={MONTHLY_PERIOD_PRESETS}
      preset={preset}
      onPresetChange={onPresetChange}
    />
  );
}

/** @deprecated — use DailyPeriodButtons */
export function HistoryPeriodButtons({
  preset,
  onPresetChange,
}: {
  preset: DailyHistoryPeriod;
  onPresetChange: (p: DailyHistoryPeriod) => void;
}) {
  return <DailyPeriodButtons preset={preset} onPresetChange={onPresetChange} />;
}

export function useDailyPeriodState(initial: DailyHistoryPeriod = 'today') {
  const [preset, setPreset] = useState<DailyHistoryPeriod>(initial);
  const today = getDateRange('today');
  const [date, setDate] = useState(today.from);

  useEffect(() => {
    if (preset === 'today' || preset === 'yesterday') {
      setDate(getDateRange(preset).from);
    }
  }, [preset]);

  return { preset, setPreset, date, setDate };
}

export function useMonthlyPeriodState(initial: MonthlyHistoryPeriod = 'month') {
  const [preset, setPreset] = useState<MonthlyHistoryPeriod>(initial);
  const today = formatLocalDate();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);

  useEffect(() => {
    const now = new Date();
    if (preset === 'days2') {
      const from = new Date(now);
      from.setDate(now.getDate() - 1);
      setDateFrom(formatLocalDate(from));
      setDateTo(formatLocalDate(now));
    } else if (preset === 'week') {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      setDateFrom(formatLocalDate(from));
      setDateTo(formatLocalDate(now));
    } else if (preset === 'month') {
      setDateFrom(`${formatLocalDate(now).slice(0, 7)}-01`);
      setDateTo(formatLocalDate(now));
    }
  }, [preset]);

  return { preset, setPreset, dateFrom, setDateFrom, dateTo, setDateTo };
}

/** @deprecated — use useDailyPeriodState */
export function useHistoryPeriodState(initial: DailyHistoryPeriod = 'today') {
  const daily = useDailyPeriodState(initial);
  return {
    preset: daily.preset,
    setPreset: daily.setPreset,
    dateFrom: daily.date,
    setDateFrom: daily.setDate,
    dateTo: daily.date,
    setDateTo: daily.setDate,
  };
}
