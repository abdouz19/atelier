'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Settings, LogOut,
  Package, Truck, Users, Scissors, Shirt,
  ArrowLeftRight, ClipboardCheck, PackageCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'الإنتاج',
    items: [
      { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
      { href: '/cutting', label: 'القص', icon: Scissors },
      { href: '/distribution', label: 'التوزيع', icon: ArrowLeftRight },
      { href: '/qc', label: 'مراقبة الجودة', icon: ClipboardCheck },
      { href: '/final-stock', label: 'المخزون النهائي', icon: PackageCheck },
    ],
  },
  {
    label: 'الإدارة',
    items: [
      { href: '/employees', label: 'الموظفون', icon: Users },
      { href: '/tailors', label: 'الخياطون', icon: Shirt },
    ],
  },
  {
    label: 'المبيعات',
    items: [
      { href: '/suppliers', label: 'الموردون', icon: Truck },
      { href: '/stock', label: 'المخزون', icon: Package },
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
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { logout, isLoading } = useAuth();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logo = useThemeStore((s) => s.logo);

  return (
    <aside className="flex h-screen w-60 flex-col border-l border-border bg-surface" dir="rtl">
      {/* Header — logo or app name */}
      <div className="flex items-center justify-center border-b border-border px-4 py-5">
        {logo ? (
          <img src={logo} alt="الشعار" className="h-10 w-auto max-w-[140px] object-contain" />
        ) : (
          <span className="text-lg font-bold text-primary-600">أتيلييه</span>
        )}
      </div>

      {/* Grouped navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-text-muted/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-text-muted hover:bg-base hover:text-text-base'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — user info + logout */}
      <div className="border-t border-border px-3 py-4 space-y-3">
        {currentUser && (
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-600">
              {getInitials(currentUser.full_name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-base">{currentUser.full_name}</p>
              <p className="truncate text-xs text-text-muted">{currentUser.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          disabled={isLoading}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
