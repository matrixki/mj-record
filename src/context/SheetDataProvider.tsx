import { ReactNode, useEffect, useState } from 'react';
import { fetchSheetData } from '../utils/fetchSheetData';
import { SheetData } from '../types/PlayerRecord';
import { SheetDataContext } from './SheetDataContext';

// Fetch the sheet once and share it, so moving between pages doesn't reload it
export function SheetDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setData(await fetchSheetData());
      } catch (err) {
        setError('Failed to load player data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <SheetDataContext.Provider value={{ data, loading, error }}>
      {children}
    </SheetDataContext.Provider>
  );
}
