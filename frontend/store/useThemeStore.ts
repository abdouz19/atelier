'use client';

import { create } from 'zustand';
import type { ThemeMode, PrimaryColor, AppearanceWithLogo } from '@/features/settings/settings.types';

interface ThemeState {
  theme: ThemeMode;
  primaryColor: PrimaryColor;
  logo: string | null;
  isLoaded: boolean;

  setTheme: (theme: ThemeMode) => void;
  setPrimaryColor: (color: PrimaryColor) => void;
  setLogo: (logo: string | null) => void;
  loadFromSettings: (settings: AppearanceWithLogo) => void;
  applyToDocument: (theme?: ThemeMode, color?: PrimaryColor) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  primaryColor: 'blue',
  logo: null,
  isLoaded: false,

  setTheme: (theme) => {
    set({ theme });
    get().applyToDocument(theme, get().primaryColor);
  },

  setPrimaryColor: (color) => {
    set({ primaryColor: color });
    get().applyToDocument(get().theme, color);
  },

  setLogo: (logo) => set({ logo }),

  loadFromSettings: (settings) => {
    set({
      theme: settings.theme,
      primaryColor: settings.primaryColor,
      logo: settings.logo,
      isLoaded: true,
    });
    get().applyToDocument(settings.theme, settings.primaryColor);
  },

  applyToDocument: (theme?: ThemeMode, color?: PrimaryColor) => {
    if (typeof document === 'undefined') return;
    const resolvedTheme = theme ?? get().theme;
    const resolvedColor = color ?? get().primaryColor;

    document.documentElement.setAttribute('data-primary', resolvedColor);

    let effectiveTheme: string;
    if (resolvedTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      effectiveTheme = resolvedTheme;
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  },
}));
