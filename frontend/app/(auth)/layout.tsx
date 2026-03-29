import { Scissors } from 'lucide-react';
import { BrandPanel } from '@/components/auth/BrandPanel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      {/* ── Right: Form panel ─────────────────────────────────────────── */}
      <div className="relative flex w-full flex-col items-center justify-center bg-[#0b0f1a] lg:w-[42%]">
        {/* Subtle noise/grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Glow accent top-right */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-64 w-64 rounded-full bg-indigo-600/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-violet-600/15 blur-[80px]" />

        {/* Logo mark top */}
        <div className="absolute top-8 right-8 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-400/30">
            <Scissors className="h-4 w-4 text-indigo-300" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white/60">أتيلييه</span>
        </div>

        {/* Form content */}
        <div className="relative z-10 w-full max-w-[380px] px-6">
          {children}
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-xs text-white/20">
          © {new Date().getFullYear()} أتيلييه — جميع الحقوق محفوظة
        </p>
      </div>

      {/* ── Left: Brand panel ─────────────────────────────────────────── */}
      <BrandPanel />
    </div>
  );
}
