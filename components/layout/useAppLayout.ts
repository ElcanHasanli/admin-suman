'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export function useAppLayout() {
  const [layout, setLayout] = useState({
    bottomNav: true,
    sidebar: false,
  });

  useEffect(() => {
    const update = () => {
      const native = Capacitor.isNativePlatform();
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      setLayout({
        bottomNav: native || !desktop,
        sidebar: !native && desktop,
      });
    };
    update();
    window.addEventListener('resize', update);
    const mq = window.matchMedia('(min-width: 1024px)');
    mq.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      mq.removeEventListener('change', update);
    };
  }, []);

  return layout;
}
