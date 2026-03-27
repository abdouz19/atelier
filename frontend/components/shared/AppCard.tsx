interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function AppCard({ children, className = '', noPadding = false }: AppCardProps) {
  return (
    <div
      className={`rounded-xl bg-surface border border-border overflow-hidden ${
        noPadding ? '' : 'p-6'
      } ${className}`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {children}
    </div>
  );
}
