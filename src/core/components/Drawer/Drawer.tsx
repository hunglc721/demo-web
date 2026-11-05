import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { DrawerProps, DrawerPlacement, DrawerSize } from './types';

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  placement = 'right',
  size = 'md',
  title,
  description,
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className,
  overlayClassName,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const placementClasses: Record<DrawerPlacement, string> = {
    right: 'inset-y-0 right-0 h-full border-l border-border-base animate-in slide-in-from-right duration-300',
    left: 'inset-y-0 left-0 h-full border-r border-border-base animate-in slide-in-from-left duration-300',
    top: 'inset-x-0 top-0 w-full max-h-[85vh] border-b border-border-base animate-in slide-in-from-top duration-300',
    bottom: 'inset-x-0 bottom-0 w-full max-h-[85vh] border-t border-border-base animate-in slide-in-from-bottom duration-300',
  };

  const sizeClasses: Record<DrawerSize, string> = {
    sm: placement === 'left' || placement === 'right' ? 'w-full max-w-xs' : 'h-64',
    md: placement === 'left' || placement === 'right' ? 'w-full max-w-md' : 'h-80',
    lg: placement === 'left' || placement === 'right' ? 'w-full max-w-lg' : 'h-96',
    xl: placement === 'left' || placement === 'right' ? 'w-full max-w-2xl' : 'h-[70vh]',
    full: placement === 'left' || placement === 'right' ? 'w-screen' : 'h-screen',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden" role="presentation">
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in',
          overlayClassName
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'fixed bg-surface-card shadow-2xl z-10 flex flex-col outline-none overflow-hidden transition-transform duration-300 ease-in-out',
          placementClasses[placement],
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description || showCloseButton) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-border-base bg-surface-card">
            <div className="flex-1 pr-4">
              {title && (
                <h3 id={titleId} className="text-lg font-semibold text-content-main leading-6">
                  {title}
                </h3>
              )}
              {description && (
                <p id={descId} className="text-sm text-content-muted mt-1">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                aria-label="Đóng ngăn kéo"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border-base px-6 py-4 bg-surface-subtle/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

Drawer.displayName = 'Drawer';
