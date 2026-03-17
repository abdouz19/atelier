'use client';

import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { CuttingKpis, CuttingSessionSummary } from '@/features/cutting/cutting.types';

export function useCuttingList() {
  const [kpis, setKpis] = useState<CuttingKpis | null>(null);
  const [sessions, setSessions] = useState<CuttingSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [kpisRes, sessionsRes] = await Promise.all([
      ipcClient.cutting.getKpis(),
      ipcClient.cutting.getAll(),
    ]);
    if (kpisRes.success) setKpis(kpisRes.data);
    else setError(kpisRes.error);
    if (sessionsRes.success) setSessions(sessionsRes.data);
    else if (!kpisRes.success) setError(sessionsRes.error);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { kpis, sessions, loading, error, refetch: fetch };
}
