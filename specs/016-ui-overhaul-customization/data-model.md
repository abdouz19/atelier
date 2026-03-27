# Data Model: UI/UX Enhancement & Platform Customization

**Branch**: `016-ui-overhaul-customization` | **Phase**: 1 | **Date**: 2026-03-27

---

## Persistence: app_settings Keys

No new database tables are needed. The existing `app_settings` key/value table absorbs all new state.

| Key | Value Type | Default | Description |
|-----|-----------|---------|-------------|
| `appearance_theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Active theme mode |
| `appearance_primary_color` | `'blue' \| 'indigo' \| 'emerald' \| 'rose' \| 'amber' \| 'slate'` | `'blue'` | Active primary color swatch |
| `appearance_logo` | Base64 data URL string | `''` (empty = none) | Uploaded atelier logo |

Defaults are inserted via `INSERT OR IGNORE` on first read (same pattern as `low_stock_threshold`).

---

## TypeScript Types

**File**: `frontend/features/settings/settings.types.ts`

```typescript
export type ThemeMode = 'light' | 'dark' | 'system';

export type PrimaryColor = 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';

export interface AppearanceSettings {
  theme: ThemeMode;
  primaryColor: PrimaryColor;
}

export interface AppearanceWithLogo extends AppearanceSettings {
  logo: string | null; // base64 data URL or null
}

export interface ColorSwatch {
  id: PrimaryColor;
  label: string;         // Arabic display name
  hex500: string;        // Primary shade (used in CSS vars)
  hex600: string;        // Hover/darker shade
  hex50: string;         // Light background tint
}
```

**Color swatch constants** (frontend-only, not persisted):

```typescript
export const COLOR_SWATCHES: ColorSwatch[] = [
  { id: 'blue',    label: 'أزرق',    hex500: '#3b82f6', hex600: '#2563eb', hex50: '#eff6ff' },
  { id: 'indigo',  label: 'نيلي',    hex500: '#6366f1', hex600: '#4f46e5', hex50: '#eef2ff' },
  { id: 'emerald', label: 'زمردي',   hex500: '#10b981', hex600: '#059669', hex50: '#ecfdf5' },
  { id: 'rose',    label: 'وردي',    hex500: '#f43f5e', hex600: '#e11d48', hex50: '#fff1f2' },
  { id: 'amber',   label: 'عنبري',   hex500: '#f59e0b', hex600: '#d97706', hex50: '#fffbeb' },
  { id: 'slate',   label: 'رمادي',   hex500: '#64748b', hex600: '#475569', hex50: '#f8fafc' },
];
```

---

## Zustand Theme Store

**File**: `frontend/store/useThemeStore.ts`

```typescript
interface ThemeState {
  theme: ThemeMode;
  primaryColor: PrimaryColor;
  logo: string | null;
  isLoaded: boolean;

  setTheme: (theme: ThemeMode) => void;
  setPrimaryColor: (color: PrimaryColor) => void;
  setLogo: (logo: string | null) => void;
  applyToDocument: () => void;   // Sets data-primary + data-theme on <html>
  loadFromSettings: (s: AppearanceWithLogo) => void;
}
```

`applyToDocument()` is called:
1. On first app load (after reading from `window.__APPEARANCE__` seed)
2. Each time a swatch or theme option is clicked in the live preview (before save)
3. After save completes (to confirm the committed values are applied)

---

## CSS Variable Architecture

**File**: `frontend/app/globals.css` (additions to existing file)

### Light mode base (default — no attribute required)
```css
:root {
  --bg-base:       #f8fafc;   /* slate-50  */
  --bg-surface:    #ffffff;
  --border-color:  #e2e8f0;   /* slate-200 */
  --text-base:     #0f172a;   /* slate-950 */
  --text-muted:    #64748b;   /* slate-500 */
  --shadow-sm:     0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
}
```

### Dark mode overrides
```css
[data-theme="dark"] {
  --bg-base:       #0f172a;
  --bg-surface:    #1e293b;
  --border-color:  #334155;
  --text-base:     #f1f5f9;
  --text-muted:    #94a3b8;
  --shadow-sm:     0 1px 3px rgba(0,0,0,0.3);
}
```

### Primary color palettes (6 swatches)
```css
/* Light mode primaries */
[data-primary="blue"]    { --primary-50:#eff6ff; --primary-500:#3b82f6; --primary-600:#2563eb; --primary-700:#1d4ed8; }
[data-primary="indigo"]  { --primary-50:#eef2ff; --primary-500:#6366f1; --primary-600:#4f46e5; --primary-700:#4338ca; }
[data-primary="emerald"] { --primary-50:#ecfdf5; --primary-500:#10b981; --primary-600:#059669; --primary-700:#047857; }
[data-primary="rose"]    { --primary-50:#fff1f2; --primary-500:#f43f5e; --primary-600:#e11d48; --primary-700:#be123c; }
[data-primary="amber"]   { --primary-50:#fffbeb; --primary-500:#f59e0b; --primary-600:#d97706; --primary-700:#b45309; }
[data-primary="slate"]   { --primary-50:#f8fafc; --primary-500:#64748b; --primary-600:#475569; --primary-700:#334155; }

/* Dark mode primary adjustments (lighter shades for readability on dark surfaces) */
[data-theme="dark"][data-primary="blue"]    { --primary-500:#60a5fa; --primary-600:#3b82f6; }
[data-theme="dark"][data-primary="indigo"]  { --primary-500:#818cf8; --primary-600:#6366f1; }
[data-theme="dark"][data-primary="emerald"] { --primary-500:#34d399; --primary-600:#10b981; }
[data-theme="dark"][data-primary="rose"]    { --primary-500:#fb7185; --primary-600:#f43f5e; }
[data-theme="dark"][data-primary="amber"]   { --primary-500:#fbbf24; --primary-600:#f59e0b; }
[data-theme="dark"][data-primary="slate"]   { --primary-500:#94a3b8; --primary-600:#64748b; }
```

### Tailwind @theme inline mapping
```css
@theme inline {
  --color-primary-50:   var(--primary-50);
  --color-primary-500:  var(--primary-500);
  --color-primary-600:  var(--primary-600);
  --color-primary-700:  var(--primary-700);
  --color-surface:      var(--bg-surface);
  --color-base:         var(--bg-base);
  --color-border:       var(--border-color);
  --color-text-base:    var(--text-base);
  --color-text-muted:   var(--text-muted);
}
```

---

## New Shared Component Contracts

Each component's props interface — no implementation details, only inputs and outputs.

### `PageHeader`
```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;  // Right side: primary CTA button(s)
}
```

### `AppCard`
```typescript
interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}
```

### `KpiCard`
```typescript
type SemanticColor = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray' | 'primary';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: SemanticColor;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    label?: string;
  };
  onClick?: () => void;
}
```

### `DataTable`
```typescript
interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  align?: 'right' | 'left' | 'center';  // default: 'right' (RTL)
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
  skeletonRows?: number;
}
```

### `AppModal`
```typescript
interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;       // scrollable body
  footer: React.ReactNode;         // sticky footer content
  size?: 'sm' | 'md' | 'lg' | 'xl';
  stepIndicator?: React.ReactNode; // optional: rendered below title in header
}
```

### `StepIndicator`
```typescript
interface StepIndicatorProps {
  steps: string[];          // Arabic step labels
  currentStep: number;      // 0-based index
}
```

### `FormField`
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;  // the input element
}
```

### `SkeletonCard`
```typescript
interface SkeletonCardProps {
  variant: 'kpi' | 'table' | 'form' | 'text';
  rows?: number;  // for 'table' variant
}
```

---

## Component Upgrade Map

Maps every existing component to its upgrade action and the shared primitive it will use.

### Layout

| Existing | Action | Uses |
|---------|--------|------|
| `Sidebar.tsx` | Full overhaul | `useThemeStore`, `useAuthStore` |
| `AppLayout.tsx` | Remove Topbar, add ThemeProvider init | — |
| `Topbar.tsx` | Delete (responsibilities moved to Sidebar) | — |

### Shared / New

| New Component | Location | Status |
|--------------|---------|--------|
| `PageHeader` | `components/shared/PageHeader.tsx` | New |
| `AppCard` | `components/shared/AppCard.tsx` | New |
| `KpiCard` | `components/shared/KpiCard.tsx` | New (replaces inline card in DashboardKpiCards) |
| `DataTable` | `components/shared/DataTable.tsx` | New |
| `AppModal` | `components/shared/AppModal.tsx` | New |
| `StepIndicator` | `components/shared/StepIndicator.tsx` | New |
| `FormField` | `components/shared/FormField.tsx` | New |
| `SkeletonCard` | `components/shared/SkeletonCard.tsx` | New |

### Per-Module Pages (all get PageHeader + AppCard wrapper)

| Page | KPI source | Table | Modals to upgrade |
|------|-----------|-------|-----------------|
| `dashboard/page.tsx` | `DashboardKpiCards` | — | — |
| `stock/page.tsx` | Inline KPI divs | `StockTable` | AddItemModal, EditItemModal, AddInboundModal, EditTransactionModal |
| `suppliers/page.tsx` | None | `SupplierTable` | AddSupplierModal, EditSupplierModal |
| `employees/page.tsx` | Inline | `EmployeeTable` | AddEmployeeModal, EditEmployeeModal, AddOperationModal, AddPaymentModal |
| `tailors/page.tsx` | Inline | `TailorTable` | NewTailorModal, EditTailorModal, TailorPaymentModal |
| `cutting/page.tsx` | Cutting KPIs | `CuttingSessionTable` | NewCuttingSessionModal |
| `distribution/page.tsx` | `DistributionKpiCards` | `DistributionSummaryTable` | DistributeModal, ReturnModal |
| `qc/page.tsx` | QC KPIs | `QcTable` | AddQcRecordModal |
| `final-stock/page.tsx` | Final stock KPIs | `FinalStockTable` | — |
| `settings/page.tsx` | — | Lookup tables | (new) AppearanceSettings section |

### Settings (New Components)

| New Component | Location |
|--------------|---------|
| `AppearanceSettings` | `components/settings/AppearanceSettings.tsx` |
| `LivePreview` | `components/settings/LivePreview.tsx` |

---

## Electron-Side: New Files

### `electron/features/settings/queries.js`

Functions (all accept `db` as first arg):
- `getAppearanceSettings(db)` → `{ theme, primaryColor }`
- `setAppearanceSettings(db, { theme, primaryColor })` → void
- `getLogo(db)` → `{ logo: string | null }`
- `setLogo(db, base64DataUrl)` → void (validates size ≤ 2MB decoded)
- `removeLogo(db)` → void
- `resetAppearanceToDefaults(db)` → `{ theme: 'system', primaryColor: 'blue', logo: null }`

### `electron/features/settings/service.js`

- `validateAppearanceSettings({ theme, primaryColor })` — throws on invalid enum values
- `validateLogoUpload(base64DataUrl)` — throws if decoded size > 2MB or MIME not PNG/JPG/SVG

### `electron/ipc/settings.handler.js`

Registers handlers for all `settings:*` channels. Calls service → queries → returns `{success,data}|{success:false,error}`.

---

## Preload Bridge Addition

**File**: `electron/preload/index.ts` — new `settings` namespace:

```typescript
settings: {
  getAppearanceSync:   () => ipcRenderer.sendSync('settings:getAppearanceSync'),
  getAppearance:       () => ipcRenderer.invoke('settings:getAppearance'),
  setAppearance:       (p) => ipcRenderer.invoke('settings:setAppearance', p),
  getLogo:             () => ipcRenderer.invoke('settings:getLogo'),
  setLogo:             (p) => ipcRenderer.invoke('settings:setLogo', p),
  removeLogo:          () => ipcRenderer.invoke('settings:removeLogo'),
  resetToDefaults:     () => ipcRenderer.invoke('settings:resetToDefaults'),
}
```
