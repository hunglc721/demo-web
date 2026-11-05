import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { useToastStore } from '@/stores/toastStore';
import { Toast } from './Toast';
import { ToastPosition } from './types';

export interface ToastContainerProps {
  position?: ToastPosition;
  className?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  className,
}) => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (typeof document === 'undefined') return null;

  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4 items-end',
    'top-left': 'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  };

  return createPortal(
    <div
      className={cn(
        'fixed z-50 pointer-events-none flex flex-col gap-2 p-4 max-w-md w-full',
        positionClasses[position],
        className
      )}
    >
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto w-full">
          <Toast toast={item} onDismiss={removeToast} />
        </div>
      ))}
    </div>,
    document.body
  );
};

ToastContainer.displayName = 'ToastContainer';
