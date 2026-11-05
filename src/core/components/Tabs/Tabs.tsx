import React, { createContext, useContext, useState, useId } from 'react';
import { cn } from '@/utils/cn';
import { TabsProps, TabListProps, TabTriggerProps, TabContentProps, TabsVariant } from './types';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (val: string) => void;
  variant: TabsVariant;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export const Tabs: React.FC<TabsProps> & {
  List: typeof TabList;
  Trigger: typeof TabTrigger;
  Content: typeof TabContent;
} = ({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  variant = 'line',
  orientation = 'horizontal',
  className,
  children,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const baseId = useId();

  const isControlled = controlledValue !== undefined;
  const activeTab = isControlled ? controlledValue : uncontrolledValue;

  const setActiveTab = (val: string) => {
    if (!isControlled) setUncontrolledValue(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant, baseId }}>
      <div
        className={cn(
          'w-full flex',
          orientation === 'vertical' ? 'flex-row gap-6' : 'flex-col gap-4',
          className
        )}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabList: React.FC<TabListProps> = ({ children, className, onKeyDown, ...props }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabList must be used inside Tabs');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const triggers = Array.from(
        (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
      );
      if (triggers.length === 0) return;

      const currentIndex = triggers.indexOf(document.activeElement as HTMLButtonElement);
      let nextIndex = 0;

      if (e.key === 'ArrowRight') {
        nextIndex = currentIndex + 1 < triggers.length ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : triggers.length - 1;
      }

      triggers[nextIndex]?.focus();
      triggers[nextIndex]?.click();
    }
  };

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center overflow-x-auto scrollbar-none',
        context.variant === 'line' && 'border-b border-border-base gap-6',
        context.variant === 'pills' && 'p-1 bg-surface-subtle rounded-theme gap-1 border border-border-base',
        context.variant === 'enclosed' && 'border-b border-border-base gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
TabList.displayName = 'TabList';

export const TabTrigger: React.FC<TabTriggerProps> = ({
  value,
  badge,
  icon,
  children,
  className,
  disabled = false,
  onClick,
  ...props
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabTrigger must be used inside Tabs');

  const { activeTab, setActiveTab, variant, baseId } = context;
  const isActive = activeTab === value;

  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  const variantClasses = {
    line: cn(
      'pb-3 pt-2 text-sm font-medium border-b-2 transition-colors relative flex items-center gap-2 whitespace-nowrap cursor-pointer',
      isActive
        ? 'border-primary text-primary'
        : 'border-transparent text-content-muted hover:text-content-main hover:border-border-base'
    ),
    pills: cn(
      'px-3.5 py-1.5 text-sm font-medium rounded-theme transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer',
      isActive
        ? 'bg-primary text-content-inverse shadow-sm'
        : 'text-content-muted hover:text-content-main hover:bg-surface-card'
    ),
    enclosed: cn(
      'px-4 py-2 text-sm font-medium rounded-t-theme border-t border-x transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer',
      isActive
        ? 'bg-surface-card border-border-base text-primary -mb-px'
        : 'bg-transparent border-transparent text-content-muted hover:text-content-main'
    ),
  }[variant];

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        setActiveTab(value);
      }}
      className={cn(
        variantClasses,
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        'focus:outline-none focus:ring-2 focus:ring-primary/40',
        className
      )}
      {...props}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={cn(
            'inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full',
            isActive ? 'bg-primary-subtle text-primary' : 'bg-surface-subtle text-content-muted'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
TabTrigger.displayName = 'TabTrigger';

export const TabContent: React.FC<TabContentProps> = ({ value, children, className, ...props }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabContent must be used inside Tabs');

  const { activeTab, baseId } = context;
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn('outline-none animate-in fade-in duration-150', className)}
      {...props}
    >
      {children}
    </div>
  );
};
TabContent.displayName = 'TabContent';

Tabs.List = TabList;
Tabs.Trigger = TabTrigger;
Tabs.Content = TabContent;
