interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function AppCard({ children, className = '', noPadding = false }: AppCardProps) {
  return (
    <div
      className={`rounded-xl bg-surface overflow-hidden ${
        noPadding ? '' : 'p-6'
      } ${className}`}
      style={{
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {children}
    </div>
  );
}
