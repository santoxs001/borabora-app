'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';
import { uid } from '@/lib/id';

export interface ToastItem {
  id: string;
  message: string;
  icon?: IconName;
  tone?: 'default' | 'uv' | 'danger';
}

interface ToastContextValue {
  toast: (message: string, opts?: Omit<ToastItem, 'id' | 'message'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback<ToastContextValue['toast']>((message, opts) => {
    const item: ToastItem = { id: uid('t'), message, ...opts };
    setItems((prev) => [...prev.slice(-2), item]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== item.id));
    }, 2800);
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'animate-toast-in surface-blur pointer-events-auto',
              'flex items-center gap-2.5 rounded-full border px-4 py-2.5',
              'text-sm font-medium shadow-card max-w-full',
              t.tone === 'uv'
                ? 'border-ultraviolet/40 text-ultraviolet-bright'
                : t.tone === 'danger'
                  ? 'border-signal-danger/40 text-signal-danger'
                  : 'border-white/[0.12] text-bone',
            )}
          >
            {t.icon && <Icon name={t.icon} size={16} />}
            <span className="truncate lowercase">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
