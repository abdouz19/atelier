'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/hooks/useUser';
import { useLookups } from '@/hooks/useLookups';
import { LookupSection } from '@/components/settings/LookupSection';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { AppCard } from '@/components/shared/AppCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { ipcClient } from '@/lib/ipc-client';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z
      .string()
      .min(8, 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل')
      .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
      .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير')
      .regex(/[0-9]/, 'يجب أن تحتوي على رقم'),
    confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتان',
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { changePassword, isLoading, error, success, clearStatus } = useUser();
  const {
    types, colors, units, models, parts, sizes,
    loading: lookupsLoading, refetch,
    createModel, updateModel, deleteModel,
    createPart, updatePart, deletePart,
    createSize, updateSize, deleteSize,
  } = useLookups();

  async function handleAdd(table: 'type' | 'color' | 'unit', name: string) {
    const res = table === 'type'
      ? await ipcClient.lookups.createType({ name })
      : table === 'color'
      ? await ipcClient.lookups.createColor({ name })
      : await ipcClient.lookups.createUnit({ name });
    if (!res.success) throw new Error(res.error);
    refetch();
  }

  async function handleEdit(table: 'type' | 'color' | 'unit', id: string, name: string) {
    const res = table === 'type'
      ? await ipcClient.lookups.updateType({ id, name })
      : table === 'color'
      ? await ipcClient.lookups.updateColor({ id, name })
      : await ipcClient.lookups.updateUnit({ id, name });
    if (!res.success) throw new Error(res.error);
    refetch();
  }

  async function handleDelete(table: 'type' | 'color' | 'unit', id: string) {
    const res = table === 'type'
      ? await ipcClient.lookups.deleteType({ id })
      : table === 'color'
      ? await ipcClient.lookups.deleteColor({ id })
      : await ipcClient.lookups.deleteUnit({ id });
    if (!res.success) throw new Error(res.error);
    refetch();
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSubmit(values: PasswordFormValues) {
    clearStatus();
    await changePassword(values.currentPassword, values.newPassword);
    if (!error) reset();
  }

  return (
    <div dir="rtl" className="space-y-6">
      <PageHeader title="الإعدادات" />

      <AppCard>
        <h2 className="mb-4 text-base font-semibold text-text-base">تخصيص المنصة</h2>
        <AppearanceSettings />
      </AppCard>

      <div className="max-w-2xl space-y-6">

      <LookupSection
        title="أنواع الأصناف"
        items={types}
        loading={lookupsLoading}
        addLabel="إضافة نوع"
        onAdd={(name) => handleAdd('type', name)}
        onEdit={(id, name) => handleEdit('type', id, name)}
        onDelete={(id) => handleDelete('type', id)}
      />
      <LookupSection
        title="الألوان"
        items={colors}
        loading={lookupsLoading}
        addLabel="إضافة لون"
        onAdd={(name) => handleAdd('color', name)}
        onEdit={(id, name) => handleEdit('color', id, name)}
        onDelete={(id) => handleDelete('color', id)}
      />
      <LookupSection
        title="الوحدات"
        items={units}
        loading={lookupsLoading}
        addLabel="إضافة وحدة"
        onAdd={(name) => handleAdd('unit', name)}
        onEdit={(id, name) => handleEdit('unit', id, name)}
        onDelete={(id) => handleDelete('unit', id)}
      />
      <LookupSection
        title="الموديلات"
        items={models}
        loading={lookupsLoading}
        addLabel="إضافة موديل"
        onAdd={async (name) => { const r = await createModel(name); if (!r.success) throw new Error(r.error); }}
        onEdit={async (id, name) => { const r = await updateModel(id, name); if (!r.success) throw new Error(r.error); }}
        onDelete={async (id) => { const r = await deleteModel(id); if (!r.success) throw new Error(r.error); }}
      />
      <LookupSection
        title="القطع"
        items={parts}
        loading={lookupsLoading}
        addLabel="إضافة قطعة"
        onAdd={async (name) => { const r = await createPart(name); if (!r.success) throw new Error(r.error); }}
        onEdit={async (id, name) => { const r = await updatePart(id, name); if (!r.success) throw new Error(r.error); }}
        onDelete={async (id) => { const r = await deletePart(id); if (!r.success) throw new Error(r.error); }}
      />
      <LookupSection
        title="المقاسات"
        items={sizes}
        loading={lookupsLoading}
        addLabel="إضافة مقاس"
        onAdd={async (name) => { const r = await createSize(name); if (!r.success) throw new Error(r.error); }}
        onEdit={async (id, name) => { const r = await updateSize(id, name); if (!r.success) throw new Error(r.error); }}
        onDelete={async (id) => { const r = await deleteSize(id); if (!r.success) throw new Error(r.error); }}
      />

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">تغيير كلمة المرور</h2>

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            تم تغيير كلمة المرور بنجاح
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              كلمة المرور الحالية
            </label>
            <input
              type="password"
              autoComplete="current-password"
              {...register('currentPassword')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('newPassword')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>

      </div>
    </div>
  );
}

