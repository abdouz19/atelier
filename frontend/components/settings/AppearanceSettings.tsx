'use client';

import { useState, useRef } from 'react';
import { Sun, Moon, Monitor, Check, Upload, X } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { useAppearanceSettings } from '@/hooks/useAppearanceSettings';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LivePreview } from './LivePreview';
import { COLOR_SWATCHES } from '@/features/settings/settings.types';
import type { ThemeMode, PrimaryColor } from '@/features/settings/settings.types';

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: React.ElementType }[] = [
  { id: 'light', label: 'فاتح', icon: Sun },
  { id: 'dark', label: 'داكن', icon: Moon },
  { id: 'system', label: 'تلقائي', icon: Monitor },
];

export function AppearanceSettings() {
  const { settings, logo, isLoading, isSaving, error, save, saveLogo, removeLogo, resetToDefaults } = useAppearanceSettings();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [stagedTheme, setStagedTheme] = useState<ThemeMode | null>(null);
  const [stagedColor, setStagedColor] = useState<PrimaryColor | null>(null);
  const [stagedLogo, setStagedLogo] = useState<string | null | undefined>(undefined); // undefined = not changed
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setTheme = useThemeStore((s) => s.setTheme);
  const setPrimaryColor = useThemeStore((s) => s.setPrimaryColor);
  const setStoreLogo = useThemeStore((s) => s.setLogo);
  const applyToDocument = useThemeStore((s) => s.applyToDocument);

  const currentTheme = stagedTheme ?? settings?.theme ?? 'system';
  const currentColor = stagedColor ?? settings?.primaryColor ?? 'blue';
  const currentLogo = stagedLogo !== undefined ? stagedLogo : logo;

  function handleThemeChange(theme: ThemeMode) {
    setStagedTheme(theme);
    setTheme(theme);
    applyToDocument();
  }

  function handleColorChange(color: PrimaryColor) {
    setStagedColor(color);
    setPrimaryColor(color);
    applyToDocument();
  }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setStagedLogo(dataUrl);
      setStoreLogo(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleSave() {
    const appearance = { theme: currentTheme, primaryColor: currentColor };
    await save(appearance);
    if (stagedLogo !== undefined) {
      if (stagedLogo) {
        await saveLogo(stagedLogo);
      } else {
        await removeLogo();
      }
      setStagedLogo(undefined);
    }
    setStagedTheme(null);
    setStagedColor(null);
  }

  async function handleReset() {
    await resetToDefaults();
    setStagedTheme(null);
    setStagedColor(null);
    setStagedLogo(undefined);
    setShowResetConfirm(false);
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-32 rounded bg-border" />
        <div className="h-24 rounded-xl bg-border" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-6">
        {/* Left: settings sections */}
        <div className="flex-1 space-y-6">
          {/* Logo */}
          <div>
            <p className="mb-2 text-sm font-semibold text-text-base">الشعار</p>
            <div className="flex items-center gap-3">
              {currentLogo ? (
                <img src={currentLogo} alt="الشعار" className="h-12 w-auto max-w-[120px] rounded-lg border border-border object-contain p-1" />
              ) : (
                <div className="flex h-12 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border text-xs text-text-muted">
                  لا يوجد شعار
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-base hover:bg-base"
              >
                <Upload size={14} />
                رفع الشعار
              </button>
              {currentLogo && (
                <button
                  onClick={() => { setStagedLogo(null); setStoreLogo(null); }}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  <X size={14} />
                  إزالة
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={handleLogoFile}
              />
            </div>
          </div>

          {/* Theme */}
          <div>
            <p className="mb-2 text-sm font-semibold text-text-base">الثيم</p>
            <div className="flex gap-3">
              {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleThemeChange(id)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 transition-colors ${
                    currentTheme === id
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-border bg-surface text-text-muted hover:border-primary-500/40'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary color */}
          <div>
            <p className="mb-2 text-sm font-semibold text-text-base">اللون الأساسي</p>
            <div className="flex gap-3">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.id}
                  title={swatch.label}
                  onClick={() => handleColorChange(swatch.id)}
                  style={{ backgroundColor: swatch.hex500 }}
                  className={`relative h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    currentColor === swatch.id ? 'ring-2 ring-offset-2 scale-110' : ''
                  }`}
                >
                  {currentColor === swatch.id && (
                    <Check size={14} className="absolute inset-0 m-auto text-white" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Save / Reset */}
          <div className="flex items-center gap-4 border-t border-border pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-sm text-text-muted underline hover:text-text-base"
            >
              استعادة الإعدادات الافتراضية
            </button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="flex-shrink-0">
          <LivePreview />
        </div>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title="استعادة الإعدادات الافتراضية"
        message="سيتم إعادة تعيين الثيم واللون الأساسي والشعار إلى القيم الافتراضية."
        confirmLabel="استعادة"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        loading={isSaving}
      />
    </>
  );
}
