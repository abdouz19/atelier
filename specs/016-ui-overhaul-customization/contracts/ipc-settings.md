# IPC Contract: Settings Namespace

**Feature**: `016-ui-overhaul-customization`
**Transport**: Electron `contextBridge` / `ipcRenderer` via `window.ipcBridge.settings.*`
**Pattern**: All async channels return `{ success: true; data: T } | { success: false; error: string }`

---

## Channel: `settings:getAppearanceSync`

**Direction**: Renderer → Main (synchronous — preload init only)
**Purpose**: Read appearance settings before first React render to avoid theme flash.
**Called from**: `electron/preload/index.ts` during preload initialization only. Never from renderer code.

**Request**: (none — no payload)

**Response** (sync return value):
```typescript
{
  theme: 'light' | 'dark' | 'system';
  primaryColor: 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
}
```

**Defaults returned when keys are absent**:
- `theme`: `'system'`
- `primaryColor`: `'blue'`

**Error handling**: Returns defaults silently on database error. Must never throw — a crash in preload breaks the entire app.

---

## Channel: `settings:getAppearance`

**Direction**: Renderer → Main (async)
**Purpose**: Read current appearance settings (theme + primaryColor) for the settings page UI.

**Request**: (none)

**Response**:
```typescript
{ success: true; data: { theme: ThemeMode; primaryColor: PrimaryColor } }
| { success: false; error: string }
```

---

## Channel: `settings:setAppearance`

**Direction**: Renderer → Main (async)
**Purpose**: Persist theme mode and primary color after user clicks Save in the customization section.

**Request payload**:
```typescript
{
  theme: 'light' | 'dark' | 'system';
  primaryColor: 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
}
```

**Validation** (in service layer):
- `theme` must be one of the three valid string literals — invalid value → error
- `primaryColor` must be one of the six valid string literals — invalid value → error

**Response**:
```typescript
{ success: true; data: null }
| { success: false; error: string }
```

---

## Channel: `settings:getLogo`

**Direction**: Renderer → Main (async)
**Purpose**: Read the stored logo for display in the settings page and Sidebar.

**Request**: (none)

**Response**:
```typescript
{ success: true; data: { logo: string | null } }
| { success: false; error: string }
```

- `logo` is a base64 data URL (e.g., `data:image/png;base64,...`) or `null` if no logo is set.

---

## Channel: `settings:setLogo`

**Direction**: Renderer → Main (async)
**Purpose**: Store an uploaded logo image.

**Request payload**:
```typescript
{
  dataUrl: string;  // base64 data URL: "data:image/png;base64,..." or "data:image/jpeg;..." or "data:image/svg+xml;..."
}
```

**Validation** (in service layer):
- `dataUrl` must start with `data:image/png;base64,`, `data:image/jpeg;base64,`, or `data:image/svg+xml;base64,` — other types → `'نوع الملف غير مدعوم. يُقبل فقط: PNG، JPG، SVG'`
- Decoded byte size must be ≤ 2MB (2,097,152 bytes) — exceeds → `'حجم الملف يتجاوز الحد المسموح به (2 ميغابايت)'`

**Response**:
```typescript
{ success: true; data: null }
| { success: false; error: string }
```

---

## Channel: `settings:removeLogo`

**Direction**: Renderer → Main (async)
**Purpose**: Delete the stored logo, restoring the default app name display.

**Request**: (none)

**Response**:
```typescript
{ success: true; data: null }
| { success: false; error: string }
```

---

## Channel: `settings:resetToDefaults`

**Direction**: Renderer → Main (async)
**Purpose**: Atomically restore all appearance settings to factory defaults. Called after user confirms the reset action in the UI.

**Request**: (none)

**Response**:
```typescript
{
  success: true;
  data: {
    theme: 'system';
    primaryColor: 'blue';
    logo: null;
  }
}
| { success: false; error: string }
```

The returned data is the new defaults state, allowing the frontend to update the Zustand store and live preview in a single step.

---

## ipc-client.ts Additions

New entries in `frontend/lib/ipc-client.ts`:

```typescript
settings: {
  getAppearance: () =>
    getBridge().settings.getAppearance() as Promise<
      { success: true; data: { theme: ThemeMode; primaryColor: PrimaryColor } }
      | { success: false; error: string }
    >,

  setAppearance: (payload: { theme: ThemeMode; primaryColor: PrimaryColor }) =>
    getBridge().settings.setAppearance(payload) as Promise<
      { success: true; data: null } | { success: false; error: string }
    >,

  getLogo: () =>
    getBridge().settings.getLogo() as Promise<
      { success: true; data: { logo: string | null } } | { success: false; error: string }
    >,

  setLogo: (payload: { dataUrl: string }) =>
    getBridge().settings.setLogo(payload) as Promise<
      { success: true; data: null } | { success: false; error: string }
    >,

  removeLogo: () =>
    getBridge().settings.removeLogo() as Promise<
      { success: true; data: null } | { success: false; error: string }
    >,

  resetToDefaults: () =>
    getBridge().settings.resetToDefaults() as Promise<
      { success: true; data: { theme: ThemeMode; primaryColor: PrimaryColor; logo: null } }
      | { success: false; error: string }
    >,
},
```

---

## Zod Schema (Renderer-Side Validation)

Used in the `AppearanceSettings` form before calling IPC:

```typescript
// frontend/features/settings/settings.types.ts
import { z } from 'zod';

export const AppearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  primaryColor: z.enum(['blue', 'indigo', 'emerald', 'rose', 'amber', 'slate']),
});

export type AppearanceFormValues = z.infer<typeof AppearanceSchema>;
```
