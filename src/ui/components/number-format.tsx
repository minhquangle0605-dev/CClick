import { createContext, useContext, useMemo } from 'react';
import { amount } from '@shared/amount';
import type { DisplaySettings } from '@shared/display-settings';

export type NumberFormatter = (value: string | number) => string;
export const NumberFormatContext = createContext<DisplaySettings['numberFormat']>('compact');
export function useNumberFormat(): NumberFormatter {
  const mode = useContext(NumberFormatContext);
  return useMemo(() => (value: string | number) => amount.format(String(value), mode), [mode]);
}
