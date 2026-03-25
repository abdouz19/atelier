'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, LogOut, Package, Truck, Users, Scissors, Shirt, ArrowLeftRight, ClipboardCheck, PackageCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  // Raw materials
  { href: '/suppliers', label: 'الموردون', icon: Truck },
  { href: '/stock', label: 'المخزون', icon: Package },
  // People
  { href: '/employees', label: 'الموظفون', icon: Users },
  { href: '/tailors', label: 'الخياطون', icon: Shirt },
  // Production flow
  { href: '/cutting', label: 'القص', icon: Scissors },
  { href: '/distribution', label: 'التوزيع', icon: ArrowLeftRight },
  { href: '/qc', label: 'مراقبة الجودة', icon: ClipboardCheck },
  { href: '/final-stock', label: 'المخزون النهائي', icon: PackageCheck },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, isLoading } = useAuth();

  return (
    <aside
      className="flex h-screen w-56 flex-col border-l border-gray-200 bg-white"
      dir="rtl"
    >
      <div className="flex items-center justify-center border-b border-gray-200 px-4 py-5">
        <span className="text-lg font-bold text-blue-600">أتيلييه</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 px-3 py-4">
        <button
          onClick={logout}
          disabled={isLoading}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
