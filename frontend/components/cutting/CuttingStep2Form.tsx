'use client';

import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { ipcClient } from '@/lib/ipc-client';
import type { EmployeeEntry } from '@/features/cutting/cutting.types';
import type { EmployeeSummary } from '@/features/employees/employees.types';

export interface Step2Values {
  employeeEntries: EmployeeEntry[];
  employeeCost: number;
}

interface EmployeeRowState {
  employeeId: string;
  name: string;
  checked: boolean;
  layers: string;
  pricePerLayer: string;
  layersError?: string;
  priceError?: string;
}

const entrySchema = z.object({
  layers: z.coerce.number().int().min(1, 'عدد الطبقات مطلوب'),
  pricePerLayer: z.coerce.number().positive('سعر الطبقة مطلوب'),
});

interface CuttingStep2FormProps {
  onNext: (values: Step2Values) => void;
  onBack: () => void;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function CuttingStep2Form({ onNext, onBack }: CuttingStep2FormProps) {
  const [rows, setRows] = useState<EmployeeRowState[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    ipcClient.employees.getAll().then(r => {
      if (r.success) {
        setRows(
          r.data
            .filter((e: EmployeeSummary) => e.status === 'active')
            .map((e: EmployeeSummary) => ({
              employeeId: e.id,
              name: e.name,
              checked: false,
              layers: '',
              pricePerLayer: '',
            }))
        );
      }
    });
  }, []);

  const checkedRows = rows.filter(r => r.checked);

  const employeeCost = useMemo(
    () => round2(
      checkedRows.reduce((sum, r) => {
        const l = parseFloat(r.layers) || 0;
        const p = parseFloat(r.pricePerLayer) || 0;
        return sum + l * p;
      }, 0)
    ),
    [checkedRows],
  );

  function toggleEmployee(employeeId: string) {
    setRows(prev => prev.map(r => r.employeeId === employeeId ? { ...r, checked: !r.checked, layersError: undefined, priceError: undefined } : r));
    setGlobalError(null);
  }

  function updateRow(employeeId: string, field: 'layers' | 'pricePerLayer', value: string) {
    setRows(prev => prev.map(r => {
      if (r.employeeId !== employeeId) return r;
      const updated = { ...r, [field]: value };
      // clear per-field error on change
      if (field === 'layers') updated.layersError = undefined;
      if (field === 'pricePerLayer') updated.priceError = undefined;
      return updated;
    }));
  }

  function handleNext() {
    setGlobalError(null);
    if (checkedRows.length === 0) {
      setGlobalError('اختر موظفاً واحداً على الأقل');
      return;
    }

    let hasErrors = false;
    const updatedRows = rows.map(r => {
      if (!r.checked) return r;
      const result = entrySchema.safeParse({ layers: r.layers, pricePerLayer: r.pricePerLayer });
      if (!result.success) {
        hasErrors = true;
        const layersErr = result.error.flatten().fieldErrors.layers?.[0];
        const priceErr = result.error.flatten().fieldErrors.pricePerLayer?.[0];
        return { ...r, layersError: layersErr, priceError: priceErr };
      }
      return { ...r, layersError: undefined, priceError: undefined };
    });

    setRows(updatedRows);
    if (hasErrors) return;

    const employeeEntries: EmployeeEntry[] = checkedRows.map(r => ({
      employeeId: r.employeeId,
      layers: parseInt(r.layers, 10),
      pricePerLayer: parseFloat(r.pricePerLayer),
    }));

    onNext({ employeeEntries, employeeCost });
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <p className="mb-2 text-sm font-medium">الموظفون النشطون</p>
        <div className="max-h-36 overflow-y-auto rounded-lg border border-border p-2">
          {rows.length === 0 && (
            <p className="py-2 text-center text-xs text-text-muted">لا يوجد موظفون نشطون</p>
          )}
          {rows.map(r => (
            <label key={r.employeeId} className="flex cursor-pointer items-center gap-2 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={r.checked}
                onChange={() => toggleEmployee(r.employeeId)}
                className="rounded"
              />
              {r.name}
            </label>
          ))}
        </div>
        {globalError && <p className="mt-1 text-xs text-red-500">{globalError}</p>}
      </div>

      {checkedRows.length > 0 && (
        <div className="space-y-2">
          {checkedRows.map(r => {
            const l = parseFloat(r.layers) || 0;
            const p = parseFloat(r.pricePerLayer) || 0;
            const total = round2(l * p);
            return (
              <EmployeeDetailRow
                key={r.employeeId}
                row={r}
                total={total}
                onLayersChange={v => updateRow(r.employeeId, 'layers', v)}
                onPriceChange={v => updateRow(r.employeeId, 'pricePerLayer', v)}
              />
            );
          })}

          <div className="flex items-center justify-between rounded-lg border border-border bg-base/40 px-3 py-2 text-sm">
            <span className="text-text-muted">إجمالي تكلفة العمال</span>
            <strong className="text-primary-600">{employeeCost.toFixed(2)} دج</strong>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="rounded-lg border border-border px-4 py-2 text-sm text-text-base hover:bg-base/60">→ السابق</button>
        <button type="button" onClick={handleNext} className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">التالي ←</button>
      </div>
    </div>
  );
}

interface EmployeeDetailRowProps {
  row: EmployeeRowState;
  total: number;
  onLayersChange: (v: string) => void;
  onPriceChange: (v: string) => void;
}

function EmployeeDetailRow({ row, total, onLayersChange, onPriceChange }: EmployeeDetailRowProps) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 text-sm font-medium">{row.name}</div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs text-text-muted">عدد الطبقات *</label>
          <input
            type="number"
            min={1}
            step={1}
            value={row.layers}
            onChange={e => onLayersChange(e.target.value)}
            className={`w-full rounded-lg border px-2 py-1.5 text-sm input-transition focus:outline-none focus:border-primary-500 ${row.layersError ? 'border-red-400' : 'border-border'}`}
            placeholder="0"
          />
          {row.layersError && <p className="mt-0.5 text-xs text-red-500">{row.layersError}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">سعر الطبقة *</label>
          <input
            type="number"
            step="any"
            min={0}
            value={row.pricePerLayer}
            onChange={e => onPriceChange(e.target.value)}
            className={`w-full rounded-lg border px-2 py-1.5 text-sm input-transition focus:outline-none focus:border-primary-500 ${row.priceError ? 'border-red-400' : 'border-border'}`}
            placeholder="0.00"
          />
          {row.priceError && <p className="mt-0.5 text-xs text-red-500">{row.priceError}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">الإجمالي</label>
          <div className="flex h-8 items-center rounded-lg border border-border bg-base/40 px-2 text-sm font-medium">
            {total.toFixed(2)} دج
          </div>
        </div>
      </div>
    </div>
  );
}
