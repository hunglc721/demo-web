import React from 'react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export type SelectSize = 'sm' | 'md' | 'lg';
