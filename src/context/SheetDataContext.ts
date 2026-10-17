import { createContext, useContext } from 'react';
import { SheetData } from '../types/PlayerRecord';

export interface SheetDataState {
  data: SheetData | null;
  loading: boolean;
  error: string | null;
}

export const SheetDataContext = createContext<SheetDataState>({
  data: null,
  loading: true,
  error: null
});

export function useSheetData(): SheetDataState {
  return useContext(SheetDataContext);
}
