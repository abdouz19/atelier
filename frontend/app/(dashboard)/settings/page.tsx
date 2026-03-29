'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings2, Palette, Database, ShieldCheck } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useLookups } from '@/hooks/useLookups';
import { LookupSection } from '@/components/settings/LookupSection';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
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
type TabId = 'appearance' | 'data' | 'security';

const TABS: { id: TabId; label: string; icon: React.ElementType; accent: string }[] = [
  { id: 'appearance', label: 'المظهر',         icon: Palette,     accent: '#60a5fa' },
  { id: 'data',       label: 'قوائم البيانات', icon: Database,    accent: '#a78bfa' },
  { id: 'security',   label: 'الأمان',         icon: ShieldCheck, accent: '#34d399' },
];

const cardStyle: React.CSSProperties = {
  background: 'var(--card-bg)',
  borderColor: 'var(--card-border)',
  boxShadow: 'var(--card-shadow)',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('appearance');
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSubmit(values: PasswordFormValues) {
    clearStatus();
    await changePassword(values.currentPassword, values.newPassword);
    if (!error) reset();
  }

  const activeAccent = TABS.find((t) => t.id === activeTab)?.accent ?? '#60a5fa';

  return (
    <div dir="rtl" className="space-y-6">
      <PageHeader title="الإعدادات" subtitle="تخصيص المنصة وإدارة البيانات" icon={<Settings2 size={17} />} />

      <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
        {/* Dynamic accent bar */}
        <div
          className="h-0.5 w-full transition-all duration-300"
          style={{ background: `linear-gradient(90deg, transparent, ${activeAccent}, transparent)`, opacity: 0.8 }}
        />

        {/* Tab bar */}
        <div className="flex border-b px-2" style={{ borderColor: 'var(--divider)' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium -mb-px transition-all duration-200"
                style={{
                  borderBottomColor: isActive ? tab.accent : 'transparent',
                  color: isActive ? tab.accent : '#64748b',
                }}
                onMouseEnter={!isActive ? (e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; } : undefined}
                onMouseLeave={!isActive ? (e) => { (e.currentTarget as HTMLElement).style.color = '#64748b'; } : undefined}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-6">

          {/* ─── المظهر ─── */}
          {activeTab === 'appearance' && (
            <div>
              <p className="mb-5 text-sm" style={{ color: 'var(--cell-dim)' }}>
                خصّص مظهر المنصة من خلال ضبط اللون الأساسي والثيم وشعار المنصة.
              </p>
              <AppearanceSettings />
            </div>
          )}

          {/* ─── قوائم البيانات ─── */}
          {activeTab === 'data' && (
            <div>
              <p className="mb-5 text-sm" style={{ color: 'var(--cell-dim)' }}>
                أدر القوائم المرجعية المستخدمة في جميع أنحاء المنصة. القيم الثابتة لا يمكن تعديلها أو حذفها.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              </div>
            </div>
          )}

          {/* ─── الأمان ─── */}
          {activeTab === 'security' && (
            <div className="max-w-md">
              <p className="mb-5 text-sm" style={{ color: 'var(--cell-dim)' }}>
                قم بتحديث كلمة المرور بانتظام للحفاظ على أمان حسابك.
              </p>

              {success && (
                <div className="mb-5 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                  ✓ &nbsp;تم تغيير كلمة المرور بنجاح
                </div>
              )}
              {error && (
                <div className="mb-5 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {[
                  { name: 'currentPassword' as const, label: 'كلمة المرور الحالية', autoComplete: 'current-password' },
                  { name: 'newPassword' as const, label: 'كلمة المرور الجديدة', autoComplete: 'new-password' },
                  { name: 'confirmPassword' as const, label: 'تأكيد كلمة المرور', autoComplete: 'new-password' },
                ].map(({ name, label, autoComplete }) => (
                  <div key={name}>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</label>
                    <input
                      type="password"
                      autoComplete={autoComplete}
                      {...register(name)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#f1f5f9',
                      }}
                      onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52,211,153,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(52,211,153,0.08)'; }}
                      onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                    />
                    {errors[name] && (
                      <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors[name]?.message}</p>
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}
                  onMouseEnter={!isLoading ? (e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; } : undefined}
                  onMouseLeave={!isLoading ? (e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; } : undefined}
                >
                  {isLoading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
