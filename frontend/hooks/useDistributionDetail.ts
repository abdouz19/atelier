import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { DistributionTailorDetail } from '@/features/distribution/distribution.types';

export function useDistributionDetail(tailorId: string | null) {
  const [detail, setDetail] = useState<DistributionTailorDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!tailorId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ipcClient.distribution.getDetailByTailor({ tailorId });
      if (res.success) { setDetail(res.data); } else { setError(res.error); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, [tailorId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { detail, loading, error, refetch: fetchDetail };
}
