import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  ModalProps,
  ModalHeaderProps,
  ModalTitleProps,
  ModalDescriptionProps,
  ModalBodyProps,
  ModalFooterProps,
  ModalSize,
} from './types';

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  className,
  children,
  onClose,
  showCloseButton = true,
  ...props
}) => (
  <div className={cn('flex items-start justify-between px-6 py-4 border-b border-border-base', className)} {...props}>
    <div className="flex-1 pr-4">{children}</div>
    {showCloseButton && onClose && (
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
        aria-label="Đóng"
      >
        <X className="w-5 h-5" />
      </button>
    )}
  </div>
);
ModalHeader.displayName = 'ModalHeader';

export const ModalTitle: React.FC<ModalTitleProps> = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-content-main leading-6', className)} {...props}>
    {children}
  </h3>
);
ModalTitle.displayName = 'ModalTitle';

export const ModalDescription: React.FC<ModalDescriptionProps> = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-content-muted mt-1', className)} {...props}>
    {children}
  </p>
);
ModalDescription.displayName = 'ModalDescription';

export const ModalBody: React.FC<ModalBodyProps> = ({ className, children, ...props }) => (
  <div className={cn('p-6 overflow-y-auto flex-1 max-h-[calc(90vh-140px)]', className)} {...props}>
    {children}
  </div>
);
ModalBody.displayName = 'ModalBody';

export const ModalFooter: React.FC<ModalFooterProps> = ({ className, children, ...props }) => (
  <div
    className={cn(
      'border-t border-border-base px-6 py-4 bg-surface-subtle/50 flex items-center justify-end gap-3',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
ModalFooter.displayName = 'ModalFooter';

export const Modal: React.FC<ModalProps> & {
  Header: typeof ModalHeader;
  Title: typeof ModalTitle;
  Description: typeof ModalDescription;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
} = ({
  isOpen,
  onClose,
  title,
  description,
  footer,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className,
  overlayClassName,
  ariaLabel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useBodyScrollLock(isOpen);

  // ESC key listener & focus trap
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap navigation
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on dialog shell
    const timer = setTimeout(() => {
      dialogRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in',
          overlayClassName
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog Shell */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-theme bg-surface-card border border-border-base shadow-2xl z-10 flex flex-col overflow-hidden outline-none',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shorthand Header if title or description or closeButton */}
        {(title || description || showCloseButton) && (
          <ModalHeader onClose={onClose} showCloseButton={showCloseButton}>
            {title && <ModalTitle id={titleId}>{title}</ModalTitle>}
            {description && <ModalDescription id={descId}>{description}</ModalDescription>}
          </ModalHeader>
        )}

        {/* Shorthand Body / Children */}
        {children && <ModalBody>{children}</ModalBody>}

        {/* Shorthand Footer */}
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </div>
    </div>,
    document.body
  );
};

Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Description = ModalDescription;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { Modal as Dialog };
