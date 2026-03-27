'use client';

import { useThemeStore } from '@/store/useThemeStore';

export function LivePreview() {
  const logo = useThemeStore((s) => s.logo);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-base min-w-[180px]">
      <p className="text-xs font-semibold text-text-muted mb-1">معاينة مباشرة</p>

      {/* Mini sidebar item */}
      <div className="flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2">
        <div className="h-3 w-3 rounded-full bg-white/60" />
        <div className="h-2 w-16 rounded bg-white/80" />
      </div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2">
        <div className="h-3 w-3 rounded-full bg-text-muted/30" />
        <div className="h-2 w-12 rounded bg-text-muted/30" />
      </div>

      {/* Mini KPI card */}
      <div className="rounded-lg border border-border bg-surface p-3 border-s-4 border-s-primary-500 mt-1">
        <div className="h-4 w-10 rounded bg-primary-500/20 mb-1" />
        <div className="text-lg font-bold text-text-base">٢٤٠</div>
        <div className="text-xs text-text-muted">مثال</div>
      </div>

      {/* Mini primary button */}
      <button className="w-full rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white">
        زر إجراء
      </button>

      {/* Logo preview if set */}
      {logo && (
        <div className="mt-1 flex justify-center">
          <img src={logo} alt="الشعار" className="h-8 w-auto object-contain" />
        </div>
      )}
    </div>
  );
}
