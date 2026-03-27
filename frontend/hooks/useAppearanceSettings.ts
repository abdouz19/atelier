'use client';

import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import { useThemeStore } from '@/store/useThemeStore';
import type { AppearanceSettings, AppearanceWithLogo } from '@/features/settings/settings.types';

interface UseAppearanceSettingsReturn {
  settings: AppearanceSettings | null;
  logo: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  save: (appearance: AppearanceSettings) => Promise<void>;
  saveLogo: (dataUrl: string) => Promise<void>;
  removeLogo: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

export function useAppearanceSettings(): UseAppearanceSettingsReturn {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromSettings = useThemeStore((s) => s.loadFromSettings);
  const applyToDocument = useThemeStore((s) => s.applyToDocument);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [appearanceRes, logoRes] = await Promise.all([
          ipcClient.settings.getAppearance(),
          ipcClient.settings.getLogo(),
        ]);
        if (cancelled) return;
        if (appearanceRes.success) {
          setSettings(appearanceRes.data);
        } else {
          setError(appearanceRes.error);
        }
        if (logoRes.success) {
          setLogo(logoRes.data.logo);
        }
      } catch {
        if (!cancelled) setError('تعذر تحميل إعدادات المظهر');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const save = useCallback(async (appearance: AppearanceSettings) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await ipcClient.settings.setAppearance(appearance);
      if (!res.success) { setError(res.error); return; }
      setSettings(appearance);
      const full: AppearanceWithLogo = { ...appearance, logo };
      loadFromSettings(full);
      applyToDocument();
    } catch {
      setError('تعذر حفظ إعدادات المظهر');
    } finally {
      setIsSaving(false);
    }
  }, [logo, loadFromSettings, applyToDocument]);

  const saveLogo = useCallback(async (dataUrl: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await ipcClient.settings.setLogo({ dataUrl });
      if (!res.success) { setError(res.error); return; }
      setLogo(dataUrl);
      if (settings) loadFromSettings({ ...settings, logo: dataUrl });
    } catch {
      setError('تعذر حفظ الشعار');
    } finally {
      setIsSaving(false);
    }
  }, [settings, loadFromSettings]);

  const removeLogo = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await ipcClient.settings.removeLogo();
      if (!res.success) { setError(res.error); return; }
      setLogo(null);
      if (settings) loadFromSettings({ ...settings, logo: null });
    } catch {
      setError('تعذر إزالة الشعار');
    } finally {
      setIsSaving(false);
    }
  }, [settings, loadFromSettings]);

  const resetToDefaults = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await ipcClient.settings.resetToDefaults();
      if (!res.success) { setError(res.error); return; }
      const defaultSettings: AppearanceSettings = { theme: 'system', primaryColor: 'blue' };
      setSettings(defaultSettings);
      setLogo(null);
      loadFromSettings({ ...defaultSettings, logo: null });
      applyToDocument();
    } catch {
      setError('تعذر استعادة الإعدادات الافتراضية');
    } finally {
      setIsSaving(false);
    }
  }, [loadFromSettings, applyToDocument]);

  return { settings, logo, isLoading, isSaving, error, save, saveLogo, removeLogo, resetToDefaults };
}
