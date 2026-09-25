'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { searchCustomers } from '@/lib/api';
import type { Customer } from '@/lib/types';
import { formatCustomerPhones, getCustomerName, truncateAddress } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

export function CustomerSearchField({
  selectedLabel,
  onSelect,
  disabled,
}: {
  selectedLabel: string;
  onSelect: (customer: Customer) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<Customer[]>([]);
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    setQuery(selectedLabel);
  }, [selectedLabel]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q || q.length < 2) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    void searchCustomers(q)
      .then((results) => {
        if (!cancelled) setMatches(results.slice(0, 8));
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Müştəri axtar
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Ad, telefon və ya ünvan..."
          disabled={disabled}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-base outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:opacity-60"
        />
      </div>
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(c);
                  setQuery(getCustomerName(c));
                  setOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-sky-50"
              >
                <span className="font-medium">{getCustomerName(c)}</span>
                <span className="ml-2 text-slate-500">{formatCustomerPhones(c)}</span>
                {c.address?.trim() && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {truncateAddress(c.address, 64)}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
