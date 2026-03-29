'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpLeft } from 'lucide-react';
import type { CriticalCombination } from '@/features/dashboard/dashboard.types';

interface Props { criticalCombinations: CriticalCombination[] }

export function PiecesAvailabilityWidget({ criticalCombinations }: Props) {
  const router = useRouter();

  if (criticalCombinations.length === 0) return null;

  return (
    <div
      className="rounded-2xl border"
      style={{ background: '#0d1422', borderColor: 'rgba(239,68,68,0.2)', boxShadow: '0 0 0 1px rgba(239,68,68,0.06), 0 1px 3px rgba(0,0,0,0.4)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'rgba(239,68,68,0.12)' }}
          >
            <AlertTriangle size={13} style={{ color: '#f87171' }} />
          </div>
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>التركيبات الحرجة</h2>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
          >
            {criticalCombinations.length}
          </span>
        </div>
        <button
          onClick={() => router.push('/distribution?tab=availability')}
          className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
          style={{ color: '#6366f1' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#818cf8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
        >
          <span>عرض الكل</span>
          <ArrowUpLeft size={11} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-5 pb-4 pt-3">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['النموذج', 'القطعة', 'المقاس', 'اللون', 'غير موزع'].map(h => (
                <th key={h} className="pb-2.5 text-right font-medium" style={{ color: '#334155' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criticalCombinations.map((combo, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => router.push('/distribution?tab=availability')}
                className="cursor-pointer transition-colors duration-150"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <td className="py-2 pr-1 font-medium" style={{ color: '#cbd5e1' }}>{combo.modelName}</td>
                <td className="py-2" style={{ color: '#94a3b8' }}>{combo.partName ?? '—'}</td>
                <td className="py-2" style={{ color: '#94a3b8' }}>{combo.sizeLabel}</td>
                <td className="py-2" style={{ color: '#94a3b8' }}>{combo.color}</td>
                <td className="py-2 font-bold tabular-nums">
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={combo.notDistributed === 0
                      ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
                      : { background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }
                    }
                  >
                    {combo.notDistributed}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
