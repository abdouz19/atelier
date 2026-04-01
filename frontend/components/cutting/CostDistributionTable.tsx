'use client';

import { useEffect, useMemo } from 'react';
import type { PartRow, CostDistributionRow, PartCost } from '@/features/cutting/cutting.types';

interface CostDistributionTableProps {
  parts: PartRow[];
  totalSessionCost: number;
  rows: CostDistributionRow[];
  onChange: (rows: CostDistributionRow[]) => void;
  onPartCosts: (costs: PartCost[]) => void;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function distributeEqual(totalCost: number, rows: CostDistributionRow[]): CostDistributionRow[] {
  const totalPieces = rows.reduce((s, r) => s + r.count, 0);
  if (totalPieces === 0) return rows.map(r => ({ ...r, unitCost: 0 }));
  const baseUnit = round2(totalCost / totalPieces);
  let assigned = 0;
  return rows.map((r, idx) => {
    if (idx === rows.length - 1) {
      // Last row absorbs rounding remainder
      const remaining = round2(totalCost - assigned);
      const unitCost = r.count > 0 ? round2(remaining / r.count) : 0;
      return { ...r, unitCost };
    }
    const unitCost = baseUnit;
    assigned = round2(assigned + unitCost * r.count);
    return { ...r, unitCost };
  });
}

function redistributeAutoRows(rows: CostDistributionRow[], totalSessionCost: number): CostDistributionRow[] {
  const lockedTotal = rows
    .filter(r => r.lockState === 'locked')
    .reduce((s, r) => s + round2(r.unitCost * r.count), 0);
  const remaining = round2(totalSessionCost - lockedTotal);
  const autoRows = rows.filter(r => r.lockState === 'auto');
  const totalAutoPieces = autoRows.reduce((s, r) => s + r.count, 0);

  if (totalAutoPieces === 0) return rows;

  const baseUnit = round2(remaining / totalAutoPieces);
  let autoAssigned = 0;
  let autoRowIdx = 0;

  return rows.map(r => {
    if (r.lockState === 'locked') return r;
    autoRowIdx++;
    if (autoRowIdx === autoRows.length) {
      // Last auto row absorbs rounding remainder
      const leftover = round2(remaining - autoAssigned);
      const unitCost = r.count > 0 ? round2(leftover / r.count) : 0;
      return { ...r, unitCost };
    }
    autoAssigned = round2(autoAssigned + baseUnit * r.count);
    return { ...r, unitCost: baseUnit };
  });
}

export function CostDistributionTable({
  parts,
  totalSessionCost,
  rows,
  onChange,
  onPartCosts,
}: CostDistributionTableProps) {
  // Initialize / reinitialize when parts or totalSessionCost changes
  useEffect(() => {
    if (parts.length === 0) return;
    const base: CostDistributionRow[] = parts.map(p => ({
      partName: p.partName,
      sizeLabel: p.sizeLabel,
      count: p.count,
      unitCost: 0,
      lockState: 'auto',
    }));
    const distributed = distributeEqual(totalSessionCost, base);
    onChange(distributed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts, totalSessionCost]);

  const grandTotal = useMemo(
    () => round2(rows.reduce((s, r) => s + round2(r.unitCost * r.count), 0)),
    [rows],
  );

  const totalMatches = Math.abs(grandTotal - totalSessionCost) < 0.01;
  const allLocked = rows.length > 0 && rows.every(r => r.lockState === 'locked');
  const hasMismatch = allLocked && !totalMatches;

  // Notify parent of current part costs
  useEffect(() => {
    onPartCosts(rows.map(r => ({ partName: r.partName, sizeLabel: r.sizeLabel, unitCost: r.unitCost })));
  }, [rows, onPartCosts]);

  function handleUnitCostChange(idx: number, rawValue: string) {
    const parsed = parseFloat(rawValue);
    const unitCost = isNaN(parsed) ? 0 : round2(parsed);
    const updated = rows.map((r, i) =>
      i === idx ? { ...r, unitCost, lockState: 'locked' as const } : r
    );
    const redistributed = redistributeAutoRows(updated, totalSessionCost);
    onChange(redistributed);
  }

  if (parts.length === 0) return null;

  return (
    <div dir="rtl" className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">توزيع التكلفة على الأجزاء</p>
        <p className="text-xs text-text-muted">
          التكلفة الإجمالية: <strong>{totalSessionCost.toFixed(2)} دج</strong>
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm" dir="rtl">
          <thead>
            <tr className="border-b border-border bg-base/40 text-xs text-text-muted">
              <th className="px-3 py-2 text-right">الجزء</th>
              <th className="px-3 py-2 text-right">المقاس</th>
              <th className="px-3 py-2 text-right">العدد</th>
              <th className="px-3 py-2 text-right">التكلفة/قطعة</th>
              <th className="px-3 py-2 text-right">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowTotal = round2(row.unitCost * row.count);
              return (
                <tr key={`${row.partName}-${row.sizeLabel}`} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{row.partName}</td>
                  <td className="px-3 py-2 text-text-muted">{row.sizeLabel}</td>
                  <td className="px-3 py-2 text-text-muted">{row.count}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.unitCost === 0 ? '' : row.unitCost}
                        onChange={e => handleUnitCostChange(idx, e.target.value)}
                        className="w-24 rounded border border-border px-2 py-1 text-sm focus:outline-none focus:border-primary-500 input-transition"
                        placeholder="0.00"
                      />
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        row.lockState === 'locked'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {row.lockState === 'locked' ? 'محدد' : 'تلقائي'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-text-muted">{rowTotal.toFixed(2)} دج</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className={`border-t-2 font-semibold text-sm ${totalMatches ? 'border-green-400' : 'border-red-400'}`}>
              <td colSpan={4} className="px-3 py-2 text-right">
                <span>المجموع: <strong>{grandTotal.toFixed(2)} دج</strong></span>
                <span className="mx-2 text-text-muted">/</span>
                <span className="text-text-muted">المطلوب: {totalSessionCost.toFixed(2)} دج</span>
              </td>
              <td className="px-3 py-2">
                {totalMatches
                  ? <span className="text-green-600 text-xs">✓ صحيح</span>
                  : <span className="text-red-500 text-xs">✗ فرق</span>
                }
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {hasMismatch && (
        <p className="text-xs text-red-500 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          مجموع التكاليف المحددة لا يساوي تكلفة الجلسة. يرجى تعديل التكاليف أو تحرير بعض الصفوف.
        </p>
      )}
    </div>
  );
}
