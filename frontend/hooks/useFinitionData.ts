import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type {
  QcRecordForFinition,
  FinitionRecordSummary,
  CreateFinitionPayload,
  CreateStepPayload,
  AddToFinalStockPayload,
} from '@/features/finition/finition.types';

export function useFinitionData() {
  const [qcRecordsForFinition, setQcRecordsForFinition] = useState<QcRecordForFinition[]>([]);
  const [records, setRecords] = useState<FinitionRecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [qcRes, recordsRes] = await Promise.all([
        ipcClient.finition.getQcRecordsForFinition(),
        ipcClient.finition.getRecords(),
      ]);
      if (qcRes.success) { setQcRecordsForFinition(qcRes.data); } else { setError(qcRes.error); }
      if (recordsRes.success) { setRecords(recordsRes.data); } else { setError(recordsRes.error); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  const createFinition = useCallback(async (payload: CreateFinitionPayload) => {
    const res = await ipcClient.finition.create(payload);
    if (res.success) { await fetchData(); }
    return res;
  }, [fetchData]);

  const createStep = useCallback(async (payload: CreateStepPayload) => {
    const res = await ipcClient.finition.createStep(payload);
    if (res.success) { await fetchData(); }
    return res;
  }, [fetchData]);

  const addToFinalStock = useCallback(async (payload: AddToFinalStockPayload) => {
    const res = await ipcClient.finition.addToFinalStock(payload);
    if (res.success) { await fetchData(); }
    return res;
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { qcRecordsForFinition, records, loading, error, refetch: fetchData, createFinition, createStep, addToFinalStock };
}
