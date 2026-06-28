'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAppLayout } from '@/components/layout/useAppLayout';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const { bottomNav } = useAppLayout();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const sizes = {
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  };

  const bottomOffset = bottomNav
    ? 'mb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:mb-0'
    : '';

  const footerPad = bottomNav
    ? 'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]'
    : 'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]';

  return createPortal(
    <Overlay onClose={onClose}>
      <Panel sizeClass={sizes[size]} hasFooter={!!footer} bottomOffset={bottomOffset}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="pr-2 text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
        {footer && (
          <div
            className={`shrink-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4 ${footerPad}`}
          >
            {footer}
          </div>
        )}
      </Panel>
    </Overlay>,
    document.body
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      {children}
    </div>
  );
}

function Panel({
  children,
  sizeClass,
  hasFooter,
  bottomOffset,
}: {
  children: React.ReactNode;
  sizeClass: string;
  hasFooter: boolean;
  bottomOffset: string;
}) {
  const heightClass = hasFooter
    ? 'max-h-[min(82dvh,82vh)] sm:max-h-[min(90dvh,90vh)]'
    : 'max-h-[min(88dvh,88vh)] sm:max-h-[min(90dvh,90vh)]';

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${heightClass} ${sizeClass} ${bottomOffset}`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}
