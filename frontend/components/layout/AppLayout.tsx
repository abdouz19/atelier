import { Sidebar } from './Sidebar';
import { PageTransition } from './PageTransition';
import { ThemeInitializer } from './ThemeInitializer';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-base" dir="rtl">
      <ThemeInitializer />
      <Sidebar />
      <PageTransition>{children}</PageTransition>
    </div>
  );
}
