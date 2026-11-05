import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ToastItem, ToastVariant } from './types';

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef<number>(toast.duration ?? 4000);
  const startRef = useRef<number>(Date.now());

  const startTimer = () => {
    if (toast.duration === 0 || toast.duration === Infinity) return;
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, remainingRef.current);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      remainingRef.current -= Date.now() - startRef.current;
    }
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const variantIcons: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-status-danger flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-status-info flex-shrink-0" />,
  };

  const variantBorders: Record<ToastVariant, string> = {
    success: 'border-l-4 border-l-status-success',
    error: 'border-l-4 border-l-status-danger',
    warning: 'border-l-4 border-l-status-warning',
    info: 'border-l-4 border-l-status-info',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      className={cn(
        'relative w-full max-w-sm rounded-theme bg-surface-card border border-border-base p-4 shadow-xl flex items-start gap-3 select-none',
        'animate-in fade-in slide-in-from-top-2 duration-200',
        variantBorders[toast.variant]
      )}
    >
      {variantIcons[toast.variant]}

      <div className="flex-1 min-w-0 pr-2">
        {toast.title && <h5 className="text-sm font-semibold text-content-main leading-5">{toast.title}</h5>}
        <p className="text-sm text-content-muted leading-5 mt-0.5">{toast.message}</p>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-xs font-semibold text-primary hover:underline focus:outline-none cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors cursor-pointer"
        aria-label="Đóng thông báo"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

Toast.displayName = 'Toast';
