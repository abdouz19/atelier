'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Settings, LogOut,
  Package, Truck, Users, Scissors, Shirt,
  ArrowLeftRight, ClipboardCheck, PackageCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { SPRING } from './PageTransition';

interface NavItem { href: string; label: string; icon: React.ElementType }
interface NavGroup { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'الإنتاج',
    items: [
      { href: '/dashboard',    label: 'لوحة التحكم',   icon: LayoutDashboard },
      { href: '/cutting',      label: 'القص',           icon: Scissors },
      { href: '/distribution', label: 'التوزيع',        icon: ArrowLeftRight },
      { href: '/qc',           label: 'مراقبة الجودة', icon: ClipboardCheck },
      { href: '/final-stock',  label: 'المخزون النهائي', icon: PackageCheck },
    ],
  },
  {
    label: 'الإدارة',
    items: [
      { href: '/employees', label: 'الموظفون', icon: Users },
      { href: '/tailors',   label: 'الخياطون', icon: Shirt },
    ],
  },
  {
    label: 'المبيعات',
    items: [
      { href: '/suppliers', label: 'الموردون', icon: Truck },
      { href: '/stock',     label: 'المخزون',  icon: Package },
    ],
  },
  {
    label: 'النظام',
    items: [
      { href: '/settings', label: 'الإعدادات', icon: Settings },
    ],
  },
];

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { logout, isLoading } = useAuth();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logo = useThemeStore((s) => s.logo);

  return (
    <aside
      className="relative flex h-screen w-[220px] flex-col overflow-hidden border-l"
      style={{ borderColor: 'var(--sidebar-divider)' }}
      style={{ background: 'var(--sidebar-bg)', backdropFilter: 'blur(12px)' }}
      dir="rtl"
    >
      {/* Ambient glow top */}
      <div className="pointer-events-none absolute -top-16 right-8 h-40 w-40 rounded-full bg-primary-500/10 blur-[60px]" />

      {/* ── Logo / Brand ───────────────────────────────────── */}
      <div className="relative flex items-center justify-center px-4 py-5">
        {logo ? (
          <img src={logo} alt="الشعار" className="h-9 w-auto max-w-[140px] object-contain" />
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/15 ring-1 ring-primary-500/30">
              <Scissors className="h-4 w-4 text-primary-500" />
            </div>
            <span className="text-base font-bold tracking-wide text-text-base">أتيلييه</span>
          </div>
        )}
      </div>

      <div className="mx-3 h-px" style={{ background: 'var(--sidebar-divider)' }} />

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted/50">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'text-white'
                        : 'text-text-muted hover:bg-primary-500/8 hover:text-text-base'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-xl bg-primary-500"
                        transition={SPRING}
                      />
                    )}
                    {/* Left accent bar for active */}
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-bar"
                        className="absolute right-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-l-full bg-white/60"
                        transition={SPRING}
                      />
                    )}
                    <Icon
                      size={17}
                      className={`relative z-10 flex-shrink-0 transition-colors duration-150 ${
                        isActive ? 'text-white' : 'text-text-muted/70'
                      }`}
                    />
                    <span className="relative z-10">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mx-3 h-px" style={{ background: 'var(--sidebar-divider)' }} />

      {/* ── User card + logout ──────────────────────────────── */}
      <div className="px-3 py-4 space-y-2">
        {currentUser && (
          <div className="flex items-center gap-3 rounded-xl bg-primary-500/5 px-3 py-2.5 ring-1 ring-primary-500/10">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}
            >
              {getInitials(currentUser.full_name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-base leading-none">{currentUser.full_name}</p>
              <p className="truncate text-xs text-text-muted mt-0.5">{currentUser.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          disabled={isLoading}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-500/80 transition-colors hover:bg-red-500/8 hover:text-red-500 disabled:opacity-50"
        >
          <LogOut size={16} className="flex-shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* Bottom ambient glow */}
      <div className="pointer-events-none absolute -bottom-12 left-4 h-32 w-32 rounded-full bg-primary-500/8 blur-[50px]" />
    </aside>
  );
}
