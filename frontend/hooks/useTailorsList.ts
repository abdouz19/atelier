import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { TailorSummary } from '@/features/tailors/tailors.types';

export function useTailorsList() {
  const [tailors, setTailors] = useState<TailorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTailors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ipcClient.tailors.getAll();
      if (res.success) { setTailors(res.data); } else { setError(res.error); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTailors(); }, [fetchTailors]);

  return { tailors, loading, error, refetch: fetchTailors };
}
