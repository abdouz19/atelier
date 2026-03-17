import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { EmployeeSummary } from '@/features/employees/employees.types';

export function useEmployeeList() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ipcClient.employees.getAll();
      if (res.success) {
        setEmployees(res.data);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { employees, loading, error, refetch: fetchEmployees };
}
