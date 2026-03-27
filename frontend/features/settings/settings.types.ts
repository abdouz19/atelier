import { z } from 'zod';

export type ThemeMode = 'light' | 'dark' | 'system';

export type PrimaryColor = 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';

export interface AppearanceSettings {
  theme: ThemeMode;
  primaryColor: PrimaryColor;
}

export interface AppearanceWithLogo extends AppearanceSettings {
  logo: string | null;
}

export interface ColorSwatch {
  id: PrimaryColor;
  label: string;
  hex500: string;
  hex600: string;
  hex50: string;
}

export const COLOR_SWATCHES: ColorSwatch[] = [
  { id: 'blue',    label: 'أزرق',   hex500: '#3b82f6', hex600: '#2563eb', hex50: '#eff6ff' },
  { id: 'indigo',  label: 'نيلي',   hex500: '#6366f1', hex600: '#4f46e5', hex50: '#eef2ff' },
  { id: 'emerald', label: 'زمردي',  hex500: '#10b981', hex600: '#059669', hex50: '#ecfdf5' },
  { id: 'rose',    label: 'وردي',   hex500: '#f43f5e', hex600: '#e11d48', hex50: '#fff1f2' },
  { id: 'amber',   label: 'عنبري',  hex500: '#f59e0b', hex600: '#d97706', hex50: '#fffbeb' },
  { id: 'slate',   label: 'رمادي',  hex500: '#64748b', hex600: '#475569', hex50: '#f8fafc' },
];

export const AppearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  primaryColor: z.enum(['blue', 'indigo', 'emerald', 'rose', 'amber', 'slate']),
});

export type AppearanceFormValues = z.infer<typeof AppearanceSchema>;
