import React, { createContext, useContext, useState, useRef } from 'react';
import { cn } from '@/utils/cn';
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  DropdownMenuContextValue,
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuSeparatorProps,
  DropdownMenuLabelProps,
  DropdownPlacement,
} from './types';

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

export const DropdownMenu: React.FC<DropdownMenuProps> & {
  Trigger: typeof DropdownMenuTrigger;
  Content: typeof DropdownMenuContent;
  Item: typeof DropdownMenuItem;
  Separator: typeof DropdownMenuSeparator;
  Label: typeof DropdownMenuLabel;
} = ({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setIsOpen = (nextOpen: boolean) => {
    if (!isControlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (!nextOpen) setActiveIndex(-1);
  };

  const closeMenu = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useClickOutside([triggerRef, contentRef], () => {
    if (isOpen) setIsOpen(false);
  });

  return (
    <DropdownMenuContext.Provider
      value={{
        isOpen,
        setIsOpen,
        triggerRef,
        contentRef,
        activeIndex,
        setActiveIndex,
        closeMenu,
      }}
    >
      <div className={cn('relative inline-block text-left', className)}>{children}</div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  className,
  onClick,
  onKeyDown,
  ...props
}) => {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');

  const { isOpen, setIsOpen, triggerRef, contentRef } = context;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e);
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
      setTimeout(() => {
        const firstItem = contentRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])');
        firstItem?.focus();
      }, 50);
    }
  };

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn('inline-flex items-center justify-center select-none outline-none cursor-pointer', className)}
      {...props}
    >
      {children}
    </button>
  );
};
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  placement = 'bottom-start',
  className,
  onKeyDown,
  ...props
}) => {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu');

  const { isOpen, contentRef, closeMenu } = context;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = Array.from(
        contentRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') || []
      );
      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
      let nextIndex = 0;

      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex + 1 < items.length ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : items.length - 1;
      }

      items[nextIndex]?.focus();
    }
  };

  if (!isOpen) return null;

  const placementClasses: Record<DropdownPlacement, string> = {
    'bottom-start': 'top-full left-0 mt-1.5',
    'bottom-end': 'top-full right-0 mt-1.5',
    'top-start': 'bottom-full left-0 mb-1.5',
    'top-end': 'bottom-full right-0 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  };

  return (
    <div
      ref={contentRef}
      role="menu"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn(
        'absolute z-50 min-w-[12rem] p-1.5 bg-surface-card border border-border-base rounded-theme shadow-xl outline-none',
        'animate-in fade-in zoom-in-95 duration-150',
        placementClasses[placement],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  icon,
  shortcut,
  variant = 'default',
  disabled = false,
  className,
  onClick,
  onSelect,
  ...props
}) => {
  const context = useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(e);
    onSelect?.();
    context?.closeMenu();
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={handleClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 text-sm rounded-theme transition-colors select-none text-left outline-none cursor-pointer',
        variant === 'default' &&
          'text-content-main hover:bg-surface-subtle focus:bg-surface-subtle focus:text-content-main',
        variant === 'danger' &&
          'text-status-danger hover:bg-status-danger/10 focus:bg-status-danger/10 focus:text-status-danger',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="w-4 h-4 text-content-muted flex-shrink-0">{icon}</span>}
        <span>{children}</span>
      </div>
      {shortcut && <span className="text-xs text-content-subtle tracking-widest">{shortcut}</span>}
    </button>
  );
};
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ className, ...props }) => (
  <div role="separator" className={cn('h-px bg-border-base my-1 -mx-1', className)} {...props} />
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ className, children, ...props }) => (
  <div
    className={cn('px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-content-muted', className)}
    {...props}
  >
    {children}
  </div>
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

DropdownMenu.Trigger = DropdownMenuTrigger;
DropdownMenu.Content = DropdownMenuContent;
DropdownMenu.Item = DropdownMenuItem;
DropdownMenu.Separator = DropdownMenuSeparator;
DropdownMenu.Label = DropdownMenuLabel;
