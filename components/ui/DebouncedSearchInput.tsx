'use client';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

const SEARCH_INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-base text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100';

export function DebouncedSearchInput({
  defaultValue = '',
  onDebouncedChange,
  delay = 250,
  placeholder,
  className = '',
}: {
  defaultValue?: string;
  onDebouncedChange: (value: string) => void;
  delay?: number;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const onChangeRef = useRef(onDebouncedChange);
  const skipFirst = useRef(true);
  onChangeRef.current = onDebouncedChange;

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const timer = setTimeout(() => onChangeRef.current(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className={`relative w-full min-w-0 ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className={SEARCH_INPUT_CLASS}
      />
    </div>
  );
}
