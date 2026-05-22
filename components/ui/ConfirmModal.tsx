'use client';

import { useCallback, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'primary';
}

export function useConfirm() {
  const [config, setConfig] = useState<ConfirmConfig | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const requestConfirm = useCallback((cfg: ConfirmConfig) => {
    return new Promise<boolean>((resolve) => {
      setConfig(cfg);
      setResolveRef(() => resolve);
    });
  }, []);

  const finish = useCallback(
    (result: boolean) => {
      resolveRef?.(result);
      setConfig(null);
      setResolveRef(null);
    },
    [resolveRef]
  );

  const ConfirmDialog = (
    <ConfirmModal
      open={!!config}
      config={config}
      onCancel={() => finish(false)}
      onConfirm={() => finish(true)}
    />
  );

  return { requestConfirm, ConfirmDialog };
}

function ConfirmModal({
  open,
  config,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  config: ConfirmConfig | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!config) return null;

  const variant = config.variant ?? 'primary';
  const confirmVariant = variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'primary';
  const Icon = variant === 'success' ? CheckCircle : AlertTriangle;
  const iconClass =
    variant === 'danger'
      ? 'bg-red-100 text-red-600'
      : variant === 'success'
        ? 'bg-emerald-100 text-emerald-600'
        : 'bg-sky-100 text-sky-600';

  return (
    <Modal open={open} onClose={onCancel} title={config.title} size="md">
      <div className="flex flex-col gap-5">
        <div className="flex gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}
          >
            <Icon size={22} />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{config.message}</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
            {config.cancelLabel ?? 'Ləğv et'}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={onConfirm} className="w-full sm:w-auto">
            {config.confirmLabel ?? 'Təsdiq et'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
