'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">تعديل موظف</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">الاسم *</label>
            <input {...register('name')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">رقم الهاتف</label>
            <input {...register('phone')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الدور</label>
            <input {...register('role')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ملاحظات</label>
            <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الصورة</label>
            {employee.photoPath && (
              <div className="mb-2 flex items-center gap-2">
                <img src={employee.photoPath} alt="" className="h-10 w-10 rounded-full object-cover" />
                <button type="button" onClick={() => { photoRef.current = 'remove'; }} className="text-xs text-red-500 hover:underline">إزالة الصورة</button>
              </div>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="text-sm" />
            {photoError && <p className="mt-1 text-xs text-red-500">{photoError}</p>}
          </div>
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
