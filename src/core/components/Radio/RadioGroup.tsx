import React, { createContext, useContext, useId } from 'react';
import { cn } from '@/utils/cn';

export interface RadioContextType {
  name: string;
  value?: string;
  onChange?: (val: string) => void;
  disabled?: boolean;
}

export const RadioContext = createContext<RadioContextType | null>(null);

export interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  label?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name: customName,
  value: controlledValue,
  defaultValue = '',
  onChange,
  orientation = 'vertical',
  disabled = false,
  label,
  children,
  className,
}) => {
  const generatedName = useId();
  const groupName = customName || generatedName;
  const [internalValue, setInternalValue] = React.useState(defaultValue);

  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;

  const handleSelect = (val: string) => {
    if (controlledValue === undefined) setInternalValue(val);
    onChange?.(val);
  };

  return (
    <RadioContext.Provider value={{ name: groupName, value: activeValue, onChange: handleSelect, disabled }}>
      <div role="radiogroup" className={cn('flex flex-col gap-2', className)}>
        {label && <span className="text-sm font-medium text-content-main select-none">{label}</span>}
        <div className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}>
          {children}
        </div>
      </div>
    </RadioContext.Provider>
  );
};

export const useRadioContext = () => useContext(RadioContext);
