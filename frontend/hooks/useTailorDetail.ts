import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { TailorDetail } from '@/features/tailors/tailors.types';

export function useTailorDetail(id: string | null) {
  const [detail, setDetail] = useState<TailorDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ipcClient.tailors.getById({ id });
      if (res.success) { setDetail(res.data); } else { setError(res.error); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { detail, loading, error, refetch: fetchDetail, setDetail };
}
