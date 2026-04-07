'use client';

import { useState, useEffect } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { SessionWithPartsRow } from '@/features/cutting/cutting.types';

export interface SessionsWithPartsFilters {
  model: string;
  size: string;
  color: string;
  partName: string;
  fabricName: string;
  employeeName: string;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: SessionsWithPartsFilters = {
  model: '',
  size: '',
  color: '',
  partName: '',
  fabricName: '',
  employeeName: '',
  dateFrom: '',
  dateTo: '',
};

export function useCuttingSessionsWithParts() {
  const [rows, setRows] = useState<SessionWithPartsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SessionsWithPartsFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ipcClient.cutting.getSessionsWithParts().then((res) => {
      if (cancelled) return;
      if (res.success) {
        setRows(res.data);
        setError(null);
      } else {
        setError(res.error);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = rows.filter((r) => {
    if (filters.model && r.modelName !== filters.model) return false;
    if (filters.size && r.sizeLabel !== filters.size) return false;
    if (filters.color && r.color !== filters.color) return false;
    if (filters.partName && r.partName !== filters.partName) return false;
    if (filters.fabricName && r.fabricName !== filters.fabricName) return false;
    if (filters.employeeName && !r.employeeNames.includes(filters.employeeName)) return false;
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      if (r.sessionDate < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() + 86_400_000;
      if (r.sessionDate > to) return false;
    }
    return true;
  });

  // Derive filter options from all rows
  const options = {
    models: [...new Set(rows.map((r) => r.modelName))].sort(),
    sizes: [...new Set(rows.map((r) => r.sizeLabel).filter(Boolean))].sort(),
    colors: [...new Set(rows.map((r) => r.color).filter(Boolean))].sort(),
    partNames: [...new Set(rows.map((r) => r.partName).filter(Boolean))].sort(),
    fabrics: [...new Set(rows.map((r) => r.fabricName).filter(Boolean))].sort(),
    employees: [...new Set(rows.flatMap((r) => r.employeeNames))].sort(),
  };

  return { rows: filtered, allRows: rows, loading, error, filters, setFilters, options };
}
