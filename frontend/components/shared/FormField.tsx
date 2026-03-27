'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, helper, required, children }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-base">
        {label}
        {required && <span className="ms-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-xs text-text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
