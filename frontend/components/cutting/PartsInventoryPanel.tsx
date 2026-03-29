'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, Package } from 'lucide-react';
import type { PartsInventoryRow } from '@/features/cutting/cutting.types';

interface PartsInventoryPanelProps {
  rows: PartsInventoryRow[];
  isLoading: boolean;
  error: string | null;
}

export function PartsInventoryPanel({ rows, isLoading, error }: PartsInventoryPanelProps) {
  const [filterModel, setFilterModel] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [filterColor, setFilterColor] = useState('');

  if (error) {
    return (
      <div className="rounded-2xl border p-5" style={{ background: 'var(--card-bg)', borderColor: 'rgba(239,68,68,0.3)' }}>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border p-5" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }} dir="rtl">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl animate-pulse" style={{ background: 'rgba(139,92,246,0.15)' }} />
          <div className="h-5 w-32 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    );
  }

  const models = Array.from(new Set(rows.map((r) => r.modelName))).sort();
  const sizes = Array.from(new Set(rows.map((r) => r.sizeLabel).filter(Boolean))).sort();
  const colors = Array.from(new Set(rows.map((r) => r.color).filter(Boolean))).sort();

  const filtered = rows.filter((r) => {
    if (filterModel && r.modelName !== filterModel) return false;
    if (filterSize && r.sizeLabel !== filterSize) return false;
    if (filterColor && r.color !== filterColor) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, PartsInventoryRow[]>>((acc, row) => {
    const key = `${row.modelName}__${row.sizeLabel}__${row.color}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const totalAvailable = rows.reduce((s, r) => s + r.availableCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
      dir="rtl"
    >
      {/* top accent bar */}
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)', opacity: 0.8 }} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(139,92,246,0.12)', boxShadow: '0 0 12px rgba(139,92,246,0.15)' }}
          >
            <Layers size={16} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h2
              className="text-base font-bold leading-none tracking-tight"
              style={{ background: 'linear-gradient(135deg, #f1f5f9 40%, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              مخزون الأجزاء
            </h2>
            {rows.length > 0 && (
              <p className="mt-0.5 text-[11px]" style={{ color: 'var(--cell-dim)' }}>
                {totalAvailable.toLocaleString('en-US')} جزء متاح
              </p>
            )}
          </div>
        </div>
        {rows.length > 0 && (
          <div
            className="rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}
          >
            {rows.length}
          </div>
        )}
      </div>

      {/* Filters */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t px-5 py-3" style={{ borderColor: 'var(--divider)' }}>
          {[
            { label: 'كل الموديلات', value: filterModel, set: setFilterModel, options: models },
            { label: 'كل المقاسات', value: filterSize, set: setFilterSize, options: sizes },
            { label: 'كل الألوان',   value: filterColor, set: setFilterColor, options: colors },
          ].map(({ label, value, set, options }) => (
            <div key={label} className="relative">
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="appearance-none rounded-lg border py-1.5 pl-7 pr-3 text-xs outline-none transition-colors"
                style={{
                  background: value ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
                  borderColor: value ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)',
                  color: value ? '#a78bfa' : '#64748b',
                }}
              >
                <option value="">{label}</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2" style={{ color: value ? '#a78bfa' : '#475569' }} />
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-5 pt-3 space-y-3">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(139,92,246,0.10)' }}>
              <Package size={22} style={{ color: '#a78bfa' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>لا توجد أجزاء متاحة</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--cell-muted)' }}>لا توجد نتائج مطابقة</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {Object.entries(grouped).map(([key, parts], groupIdx) => {
              const [modelName, sizeLabel, color] = key.split('__');
              const allZero = parts.every((p) => p.availableCount === 0);
              const accentColor = allZero ? '#ef4444' : '#a78bfa';
              const accentBg = allZero ? 'rgba(239,68,68,0.10)' : 'rgba(139,92,246,0.08)';
              const accentBorder = allZero ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.18)';

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIdx * 0.04, duration: 0.25 }}
                  className="overflow-hidden rounded-xl border"
                  style={{ background: accentBg, borderColor: accentBorder }}
                >
                  {/* Group header */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5" style={{ borderBottom: `1px solid ${accentBorder}` }}>
                    {[modelName, sizeLabel, color].filter(Boolean).map((tag, i) => (
                      <span key={i} className="text-xs font-semibold" style={{ color: accentColor }}>
                        {i > 0 && <span className="mx-1 opacity-40">·</span>}
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Part rows */}
                  <div className="divide-y divide-border/50">
                    {parts.map((p) => {
                      const isZero = p.availableCount === 0;
                      const pct = p.totalProduced > 0 ? (p.availableCount / p.totalProduced) * 100 : 0;
                      return (
                        <div key={p.partName} className="flex items-center gap-3 px-3 py-2.5">
                          <span className="flex-1 text-sm font-medium" style={{ color: isZero ? '#f87171' : '#e2e8f0' }}>
                            {p.partName}
                          </span>
                          <div className="flex items-center gap-3 text-xs tabular-nums" style={{ color: 'var(--cell-dim)' }}>
                            <span title="المنتج">{p.totalProduced}</span>
                            <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
                            <span title="الموزع">{p.totalDistributed}</span>
                            <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* availability bar */}
                            <div className="hidden w-16 overflow-hidden rounded-full sm:block" style={{ height: '3px', background: 'rgba(255,255,255,0.07)' }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  background: isZero ? '#ef4444' : pct > 50 ? '#34d399' : '#fbbf24',
                                }}
                              />
                            </div>
                            <span
                              className="min-w-[2rem] rounded-full px-2 py-0.5 text-center text-xs font-bold tabular-nums"
                              style={isZero
                                ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
                                : { background: 'rgba(16,185,129,0.12)', color: '#34d399' }
                              }
                            >
                              {p.availableCount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Legend */}
      {rows.length > 0 && (
        <div className="flex items-center gap-4 border-t px-5 py-3 text-[10px]" style={{ borderColor: 'var(--divider)', color: 'var(--cell-faint)' }}>
          <span>المنتج · الموزع · المتاح</span>
        </div>
      )}
    </motion.div>
  );
}
