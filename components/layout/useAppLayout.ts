'use client';

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Capacitor } from '@capacitor/core';

type AppLayout = {
  bottomNav: boolean;
  sidebar: boolean;
};

const DEFAULT_LAYOUT: AppLayout = {
  bottomNav: true,
  sidebar: false,
};

const AppLayoutContext = createContext<AppLayout>(DEFAULT_LAYOUT);

function readLayout(): AppLayout {
  const native = Capacitor.isNativePlatform();
  const desktop = window.matchMedia('(min-width: 1024px)').matches;
  return {
    bottomNav: native || !desktop,
    sidebar: !native && desktop,
  };
}

export function AppLayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<AppLayout>(DEFAULT_LAYOUT);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => {
      const next = readLayout();
      setLayout((prev) =>
        prev.bottomNav === next.bottomNav && prev.sidebar === next.sidebar ? prev : next
      );
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const value = useMemo(() => layout, [layout.bottomNav, layout.sidebar]);

  return createElement(AppLayoutContext.Provider, { value }, children);
}

export function useAppLayout() {
  return useContext(AppLayoutContext);
}
