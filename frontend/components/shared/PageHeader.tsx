'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start justify-between mb-6"
    >
      <div>
        <div className="flex items-center gap-3 mb-1">
          {icon && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: 'color-mix(in srgb, var(--primary-500) 15%, transparent)',
                boxShadow: '0 0 16px color-mix(in srgb, var(--primary-500) 20%, transparent)',
              }}
            >
              <span style={{ color: 'var(--primary-500)', opacity: 0.85 }}>{icon}</span>
            </div>
          )}
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #f1f5f9 30%, var(--primary-500))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-sm" style={{ color: '#334155', paddingRight: icon ? '3rem' : undefined }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
