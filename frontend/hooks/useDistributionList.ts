import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { DistributionKpis, DistributionTailorSummary } from '@/features/distribution/distribution.types';

export function useDistributionList() {
  const [kpis, setKpis] = useState<DistributionKpis | null>(null);
  const [summary, setSummary] = useState<DistributionTailorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpisRes, summaryRes] = await Promise.all([
        ipcClient.distribution.getKpis(),
        ipcClient.distribution.getSummary(),
      ]);
      if (kpisRes.success) { setKpis(kpisRes.data); } else { setError(kpisRes.error); }
      if (summaryRes.success) { setSummary(summaryRes.data); } else { setError(summaryRes.error); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { kpis, summary, loading, error, refetch: fetchData };
}
