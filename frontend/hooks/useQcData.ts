import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { QcKpis, ReturnBatchForQc, QcRecordSummary, CreateQcPayload } from '@/features/qc/qc.types';

export function useQcData() {
  const [kpis, setKpis] = useState<QcKpis | null>(null);
  const [records, setRecords] = useState<QcRecordSummary[]>([]);
  const [returnBatches, setReturnBatches] = useState<ReturnBatchForQc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpisRes, recordsRes] = await Promise.all([
        ipcClient.qc.getKpis(),
        ipcClient.qc.getRecords(),
      ]);
      if (kpisRes.success) { setKpis(kpisRes.data); } else { setError(kpisRes.error); }
      if (recordsRes.success) { setRecords(recordsRes.data); } else { setError(recordsRes.error); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReturnBatches = useCallback(async () => {
    const res = await ipcClient.qc.getReturnBatchesForQc();
    if (res.success) { setReturnBatches(res.data); }
  }, []);

  const createQcRecord = useCallback(async (payload: CreateQcPayload) => {
    const res = await ipcClient.qc.create(payload);
    if (res.success) { await fetchData(); }
    return res;
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { kpis, records, returnBatches, loading, error, refetch: fetchData, fetchReturnBatches, createQcRecord };
}
