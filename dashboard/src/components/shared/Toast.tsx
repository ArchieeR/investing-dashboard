'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

let addToastGlobal: ((message: string, variant: ToastVariant) => void) | null = null;

export function toast(message: string, variant: ToastVariant = 'success') {
  addToastGlobal?.(message, variant);
}

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
};

const borders: Record<ToastVariant, string> = {
  success: 'border-[#22C55E]/30',
  error: 'border-destructive/30',
  warning: 'border-yellow-500/30',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => {
      addToastGlobal = null;
    };
  }, [addToast]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-foreground shadow-lg animate-in slide-in-from-right-5 fade-in',
            borders[t.variant],
          )}
        >
          {icons[t.variant]}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
