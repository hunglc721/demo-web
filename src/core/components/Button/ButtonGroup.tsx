import React from 'react';
import { cn } from '@/utils/cn';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  attached?: boolean;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  className,
  attached = true,
  children,
  ...props
}) => {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex items-center',
        attached
          ? '[&>button]:rounded-none first:[&>button]:rounded-l-theme last:[&>button]:rounded-r-theme [&>button:not(:first-child)]:-ml-px'
          : 'gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';
