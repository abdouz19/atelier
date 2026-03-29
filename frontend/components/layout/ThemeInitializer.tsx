'use client';

import { useEffect } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import { useThemeStore } from '@/store/useThemeStore';

export function ThemeInitializer() {
  const isLoaded = useThemeStore((s) => s.isLoaded);
  const loadFromSettings = useThemeStore((s) => s.loadFromSettings);

  useEffect(() => {
    if (isLoaded) return;
    async function init() {
      try {
        const [appearanceRes, logoRes] = await Promise.all([
          ipcClient.settings.getAppearance(),
          ipcClient.settings.getLogo(),
        ]);
        const appearance = appearanceRes.success
          ? appearanceRes.data
          : { theme: 'system' as const, primaryColor: 'blue' as const };
        const logo = logoRes.success ? logoRes.data.logo : null;
        loadFromSettings({ ...appearance, logo });
      } catch {
        loadFromSettings({ theme: 'system', primaryColor: 'blue', logo: null });
      }
    }
    init();
  }, [isLoaded, loadFromSettings]);

  return null;
}
