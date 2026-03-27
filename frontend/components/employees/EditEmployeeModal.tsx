'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ipcClient } from '@/lib/ipc-client';
import { AppModal } from '@/components/shared/AppModal';
import { FormField } from '@/components/shared/FormField';
import type { EmployeeSummary } from '@/features/employees/employees.types';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const schema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional(),
  role: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditEmployeeModalProps {
  employee: EmployeeSummary;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEmployeeModal({ employee, onClose, onSuccess }: EditEmployeeModalProps) {
  const photoRef = useRef<{ data: string; mimeType: string } | null | 'remove'>(undefined);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: employee.name,
      phone: employee.phone ?? '',
      role: employee.role ?? '',
      notes: '',
    },
  });

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) { photoRef.current = undefined; return; }
    if (!ALLOWED_TYPES.includes(file.type)) { setPhotoError('يُسمح فقط بصور JPG أو PNG أو WEBP'); return; }
    if (file.size > MAX_PHOTO_BYTES) { setPhotoError('حجم الصورة يتجاوز 5 ميغابايت'); return; }
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    photoRef.current = { data: btoa(binary), mimeType: file.type };
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const payload: Parameters<typeof ipcClient.employees.update>[0] = {
      id: employee.id,
      name: values.name,
      phone: values.phone || null,
      role: values.role || null,
      notes: values.notes || null,
    };
    if (photoRef.current === 'remove') {
      payload.photoData = null;
    } else if (photoRef.current && typeof photoRef.current !== 'string') {
      payload.photoData = photoRef.current.data;
      payload.photoMimeType = photoRef.current.mimeType;
    }
    const res = await ipcClient.employees.update(payload);
    if (res.success) { onSuccess(); } else { setSubmitError(res.error); }
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title="تعديل موظف"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="edit-employee-form" disabled={isSubmitting} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </>
      }
    >
      <form id="edit-employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="الاسم" error={errors.name?.message} required>
          <input {...register('name')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        <FormField label="رقم الهاتف">
          <input {...register('phone')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        <FormField label="الدور">
          <input {...register('role')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        <FormField label="ملاحظات">
          <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        <FormField label="الصورة" error={photoError ?? undefined}>
          {employee.photoPath && (
            <div className="mb-2 flex items-center gap-2">
              <img src={employee.photoPath} alt="" className="h-10 w-10 rounded-full object-cover" />
              <button type="button" onClick={() => { photoRef.current = 'remove'; }} className="text-xs text-red-500 hover:underline">إزالة الصورة</button>
            </div>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="text-sm" />
        </FormField>
        {submitError && <p className="text-xs text-red-500">{submitError}</p>}
      </form>
    </AppModal>
  );
}
