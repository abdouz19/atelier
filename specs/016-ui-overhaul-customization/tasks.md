# Tasks: UI/UX Enhancement & Platform Customization

**Input**: Design documents from `/specs/016-ui-overhaul-customization/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
**Tests**: Not requested — no test tasks included.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks in same phase)
- **[Story]**: Which user story this task belongs to (US1–US6)

---

## Phase 1: Setup (Type Scaffolding)

**Purpose**: Create the new type definitions and translation file stubs that every later phase depends on. Pure scaffolding — no logic, no IPC, no CSS.

- [x] T001 Create `frontend/features/settings/settings.types.ts` — export `ThemeMode`, `PrimaryColor`, `AppearanceSettings`, `AppearanceWithLogo`, `ColorSwatch`, `COLOR_SWATCHES` constant, and `AppearanceSchema` Zod validator (see data-model.md for full shapes)
- [x] T002 [P] Create `frontend/public/locales/ar/settings.json` — all Arabic strings for the customization section: section title `"تخصيص المنصة"`, subsection labels (logo, theme, color), button labels (upload, remove, save, reset), theme option labels (light/dark/system), color swatch labels, confirmation dialog text, success/error toast messages, validation error messages for logo format and size
- [x] T003 [P] Update `frontend/public/locales/ar/common.json` — add sidebar navigation group labels (e.g., `"الإنتاج"`, `"الإدارة"`, `"المبيعات"`, `"الإعدادات"`) and any new shared UI strings for PageHeader, AppCard, EmptyState CTA defaults

**Checkpoint**: Type scaffolding ready — no build output yet, but all downstream tasks have their type contracts.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The CSS theme system, Zustand store, Electron settings backend, and IPC bridge. Every user story phase depends on this being complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Update `frontend/app/globals.css` — add: (1) `:root` light-mode base CSS variables (`--bg-base`, `--bg-surface`, `--border-color`, `--text-base`, `--text-muted`, `--shadow-sm`); (2) `[data-theme="dark"]` overrides for all surface/text variables; (3) six `[data-primary="..."]` selectors for blue/indigo/emerald/rose/amber/slate palettes (each with `--primary-50`, `--primary-500`, `--primary-600`, `--primary-700`); (4) dark-mode primary adjustments `[data-theme="dark"][data-primary="..."]` with lighter shades; (5) `@theme inline` block mapping `--color-primary-*`, `--color-surface`, `--color-base`, `--color-border`, `--color-text-base`, `--color-text-muted` to their respective CSS var references (see data-model.md for exact hex values)
- [x] T005 Update `frontend/app/layout.tsx` — add inline `<script dangerouslySetInnerHTML>` before the `<body>` that reads `window.__APPEARANCE__` (seeded by preload) and sets `document.documentElement.dataset.primary` and `document.documentElement.dataset.theme` (resolving `'system'` via `matchMedia`); also add `declare global { interface Window { __APPEARANCE__: { theme: string; primaryColor: string } } }` ambient TypeScript declaration
- [x] T006 [P] Create `frontend/store/useThemeStore.ts` — Zustand store with state: `{ theme, primaryColor, logo, isLoaded }`; actions: `setTheme`, `setPrimaryColor`, `setLogo`, `loadFromSettings(AppearanceWithLogo)`, `applyToDocument()` (sets `data-primary` and `data-theme` on `document.documentElement`, resolves `'system'` via `matchMedia` and attaches a change listener)
- [x] T007 [P] Create `electron/features/settings/queries.js` — plain JS with better-sqlite3 prepared statements: `getAppearanceSettings(db)` returns `{ theme, primaryColor }` with `INSERT OR IGNORE` defaults (`'system'`, `'blue'`); `setAppearanceSettings(db, {theme, primaryColor})` uses `INSERT OR REPLACE`; `getLogo(db)` returns `{ logo: string|null }` (empty string treated as null); `setLogo(db, dataUrl)` uses `INSERT OR REPLACE`; `removeLogo(db)` sets value to `''`; `resetAppearanceToDefaults(db)` removes all three keys and re-inserts defaults, returns default object
- [x] T008 [P] Create `electron/features/settings/service.js` — plain JS: `validateAppearanceSettings({theme, primaryColor})` throws Arabic error if enum values are invalid; `validateLogoUpload(dataUrl)` throws Arabic error if MIME prefix is not PNG/JPEG/SVG or if decoded byte size exceeds 2,097,152 bytes (calculate from base64 string length: `Math.ceil(base64Body.length * 0.75)`)
- [x] T009 Create `electron/ipc/settings.handler.js` — registers: `ipcMain.on('settings:getAppearanceSync', ...)` (synchronous, returns appearance object); `ipcMain.handle('settings:getAppearance', ...)`, `ipcMain.handle('settings:setAppearance', ...)`, `ipcMain.handle('settings:getLogo', ...)`, `ipcMain.handle('settings:setLogo', ...)`, `ipcMain.handle('settings:removeLogo', ...)`, `ipcMain.handle('settings:resetToDefaults', ...)`; all async handlers return `{success,data}|{success:false,error}` pattern; import and call service validators before queries; import `db` from the existing database instance
- [x] T010 Update `electron/main.js` (or `electron/main/index.ts`) — import and call `registerSettingsHandlers()` from `settings.handler.js` in the app startup sequence alongside the existing `registerAuthHandlers()`, etc.
- [x] T011 Update `electron/preload/index.ts` — add `settings` namespace to `ipcBridge`: `getAppearanceSync: () => ipcRenderer.sendSync('settings:getAppearanceSync')` and async invoke wrappers for `getAppearance`, `setAppearance`, `getLogo`, `setLogo`, `removeLogo`, `resetToDefaults`; also add the sync call `const __appearance = ipcRenderer.sendSync('settings:getAppearanceSync')` at the top of the preload and expose as `window.__APPEARANCE__ = __appearance` via `contextBridge`
- [x] T012 Update `frontend/lib/ipc-client.ts` — add `settings` namespace with fully typed wrappers for all 6 async channels (see contracts/ipc-settings.md for exact return types); import `ThemeMode` and `PrimaryColor` from `@/features/settings/settings.types`

**Checkpoint**: CSS theme system live, Electron backend registered, IPC bridge extended. Run `npm run dev:electron` and verify: (1) no TypeScript errors; (2) `window.ipcBridge.settings` is available in the renderer console; (3) `window.__APPEARANCE__` is populated on page load.

---

## Phase 3: User Story 1 — Modern Dashboard Experience (Priority: P1) 🎯 MVP

**Goal**: Every screen adopts the card-based layout with screen title + CTA at top, KPI cards with trend indicators below, and the main content area wrapped in a surface card. Typography hierarchy enforced. Semantic color usage consistent.

**Independent Test**: Open the app and navigate through all 9 screens. Verify: (1) every screen has a `PageHeader` with title and primary action; (2) KPI cards show a large value, muted label, colored left border, relevant icon, and trend arrow; (3) all content areas sit inside a rounded card with soft shadow; (4) screen titles are visibly larger/bolder than section labels and table content.

- [x] T013 Create `frontend/components/shared/AppCard.tsx` — named export; props: `{ children, className?, noPadding? }`; renders a `<div>` with `bg-surface rounded-xl shadow-sm border border-border p-6` (adjustable via `className`); `noPadding` omits padding for table-containing cards
- [x] T014 [P] Create `frontend/components/shared/PageHeader.tsx` — named export; props: `{ title: string, subtitle?: string, actions?: React.ReactNode }`; renders a flex row (`justify-between items-start`), RTL; title as `<h1>` with `text-2xl font-bold text-text-base`; subtitle as `<p>` with `text-sm text-text-muted mt-0.5`; actions slot on the left side (RTL); use string from props directly (caller is responsible for i18n)
- [x] T015 Create `frontend/components/shared/KpiCard.tsx` — named export; props: `{ label, value, icon: LucideIcon, color: SemanticColor, trend?: { direction, percentage, label? }, onClick? }` (types from `settings.types.ts`); renders: left-side colored border using `border-l-4` with semantic color mapping (green/red/amber/blue/purple/gray — use fixed Tailwind colors for semantic meaning, `primary` maps to `border-primary-500`); icon in a tinted background circle; large bold `value`; muted `label`; trend row only if `trend` is provided: arrow icon (`TrendingUp` / `TrendingDown`) with `percentage%` text in green/red; clickable via `onClick` with `cursor-pointer hover:shadow-md transition-shadow`; `role="button"` and `tabIndex` if `onClick` provided
- [x] T016 Update `frontend/components/dashboard/DashboardKpiCards.tsx` — replace the internal `KpiCard` function with the new shared `KpiCard` component; wire `trend` prop with placeholder logic (`trend: undefined` for now — actual trend data comes from the dashboard hook in a future iteration); update color mapping to use the new `SemanticColor` type
- [x] T017 [P] [US1] Update `frontend/components/layout/AppLayout.tsx` — remove `<Topbar />` import and JSX; update the layout to `<div className="flex h-screen overflow-hidden bg-base" dir="rtl"><Sidebar /><main className="flex-1 overflow-auto">{children}</main></div>`; delete `Topbar.tsx` file
- [x] T018 [P] [US1] Update `frontend/app/(dashboard)/dashboard/page.tsx` — wrap the page content with `PageHeader` (title from locales, no primary CTA); wrap KPI grid section in `AppCard`; ensure section backgrounds use `bg-base`
- [x] T019 [P] [US1] Update `frontend/app/(dashboard)/stock/page.tsx` — add `PageHeader` with title `"المخزون"` and primary action button (existing add-item trigger); wrap KPI section in `AppCard`; wrap table section in `AppCard` with `noPadding`
- [x] T020 [P] [US1] Update `frontend/app/(dashboard)/suppliers/page.tsx` — add `PageHeader` with title `"الموردون"` and primary action button; wrap table in `AppCard` with `noPadding`
- [x] T021 [P] [US1] Update `frontend/app/(dashboard)/employees/page.tsx` — add `PageHeader` with title `"الموظفون"` and primary action; wrap KPI + table sections in `AppCard`
- [x] T022 [P] [US1] Update `frontend/app/(dashboard)/tailors/page.tsx` — add `PageHeader` with title `"الخياطون"` and primary action; wrap KPI + table sections in `AppCard`
- [x] T023 [P] [US1] Update `frontend/app/(dashboard)/cutting/page.tsx` — add `PageHeader` with title `"جلسات القص"` and primary action; wrap KPI + table sections in `AppCard`
- [x] T024 [P] [US1] Update `frontend/app/(dashboard)/distribution/page.tsx` — add `PageHeader` with title `"التوزيع"` and primary action; wrap KPI + table sections in `AppCard`
- [x] T025 [P] [US1] Update `frontend/app/(dashboard)/qc/page.tsx` — add `PageHeader` with title `"مراقبة الجودة"` and primary action; wrap KPI + table sections in `AppCard`
- [x] T026 [P] [US1] Update `frontend/app/(dashboard)/final-stock/page.tsx` — add `PageHeader` with title `"المخزون النهائي"` and primary action; wrap KPI + table sections in `AppCard`
- [x] T027 [P] [US1] Update `frontend/app/(dashboard)/settings/page.tsx` — add `PageHeader` with title `"الإعدادات"` (no primary action CTA); wrap each settings section (lookups, password, future appearance) in individual `AppCard` components

**Checkpoint**: US1 complete. Open app and navigate all screens — every page has PageHeader + AppCard wrapping. KPI cards visible with trend slot (showing nothing for trend until data wired). No Topbar visible anywhere.

---

## Phase 4: User Story 2 — Platform Customization & Branding (Priority: P2)

**Goal**: Settings screen has a "تخصيص المنصة" section where the user can upload a logo, toggle theme, pick a primary color, and see a live preview — all persisting to SQLite and applied on every restart.

**Independent Test**: Navigate to Settings → تخصيص المنصة. Change color to indigo + theme to dark. Observe live preview updates. Click Save. Close and reopen the app. Verify indigo + dark mode are applied from first paint.

- [x] T028 Create `frontend/hooks/useAppearanceSettings.ts` — data-fetching hook (no JSX); calls `ipcClient.settings.getAppearance()` and `ipcClient.settings.getLogo()` on mount; exposes `{ settings, logo, isLoading, error, save(appearance), saveLogo(dataUrl), removeLogo(), resetToDefaults(), isSaving }`; on successful save calls `useThemeStore.loadFromSettings()` then `applyToDocument()`; wraps all IPC errors in user-facing Arabic strings
- [x] T029 [P] [US2] Create `frontend/components/settings/LivePreview.tsx` — reads `useThemeStore` for current staged (unsaved) `primaryColor`, `theme`, and `logo`; renders a miniature preview panel (fixed width, right-aligned in the settings card): a small fake sidebar item with pill indicator in `bg-primary-500`; a small KPI card with colored left border; a primary-colored filled button; updates reactively as store state changes; all preview elements use CSS custom property–based classes so they respond to `data-primary`/`data-theme` changes immediately
- [x] T030 [US2] Create `frontend/components/settings/AppearanceSettings.tsx` — three subsections inside an `AppCard`: (1) **Logo** — shows current logo image or placeholder box; "رفع الشعار" button opens `<input type="file" accept="image/png,image/jpeg,image/svg+xml">`, reads file as base64 data URL, updates `useThemeStore.setLogo()` for preview, stores staged value; "إزالة الشعار" button (only when logo is set) clears staged logo; (2) **الثيم** — three clickable option cards (light/dark/system) each with an icon and Arabic label; clicking one calls `useThemeStore.setTheme()` + `applyToDocument()` immediately for live preview; (3) **اللون الأساسي** — row of 6 filled circle swatches using `COLOR_SWATCHES`; selected swatch has a checkmark icon overlay and a ring; clicking calls `useThemeStore.setPrimaryColor()` + `applyToDocument()`; **Save footer**: "حفظ" button calls `useAppearanceSettings.save()` then logo save/remove if changed; "استعادة الإعدادات الافتراضية" link opens `ConfirmDialog` then calls `resetToDefaults()`; `LivePreview` panel rendered to the right of the three subsections (flex row layout)
- [x] T031 [US2] Update `frontend/app/(dashboard)/settings/page.tsx` — import and render `<AppearanceSettings />` as a new section above or below the existing lookup/password sections; wrap in its own `AppCard` with the section title from locales

**Checkpoint**: US2 complete. Full customization flow works end-to-end. Test logo upload, theme change, color change, save, restart persistence, and reset-to-defaults with confirmation.

---

## Phase 5: User Story 3 — Upgraded Data Tables (Priority: P3)

**Goal**: All data tables across the app have sticky headers, alternating row backgrounds, subtle row hover highlight, RTL-appropriate column alignment, and action buttons that appear only on hover.

**Independent Test**: Open any table screen (e.g., Stock). Scroll a long list — header stays pinned. Hover a row — background changes. Hover the actions cell — icon buttons appear. Numbers are right-aligned within the RTL layout.

- [x] T032 Create `frontend/components/shared/DataTable.tsx` — generic component `DataTable<T>`; props: `{ columns, rows, keyExtractor, onRowClick?, emptyState?, footer?, isLoading?, skeletonRows? }` (see data-model.md for full column/prop interfaces); renders: `<table>` inside a scroll container; `<thead>` with `position: sticky; top: 0` and a slightly darker background (`bg-base/50 backdrop-blur-sm`); `<tbody>` with alternating rows (`even:bg-surface odd:bg-base/30`); row `hover:bg-primary-50` transition; action cells with `opacity-0 group-hover:opacity-100 transition-opacity` on the row's `group` class; column alignment driven by `align` prop defaulting to `'right'`; when `isLoading` is true, renders `skeletonRows` skeleton rows using `SkeletonCard` variant `'table'` (forward-reference — SkeletonCard created in Phase 7); when `rows.length === 0` and not loading, renders `emptyState` prop content; optional `footer` rendered as a `<tfoot>` row spanning all columns
- [x] T033 [P] [US3] Update `frontend/components/stock/StockTable.tsx` — replace custom `<table>` with `DataTable`; define `columns` array mapping to existing columns (type, name, quantity, unit, actions); pass `onRowClick` for row selection; move action buttons (edit, delete, archive) into the `render` function of an `actions` column and add `group` hover pattern; pass `emptyState={<EmptyState ... />}`
- [x] T034 [P] [US3] Update `frontend/components/suppliers/SupplierTable.tsx` — same pattern as T033; columns: name, phone, address, products, notes, actions
- [x] T035 [P] [US3] Update `frontend/components/employees/EmployeeTable.tsx` — columns: name, role, phone, balance, actions
- [x] T036 [P] [US3] Update `frontend/components/tailors/TailorTable.tsx` — columns: name, phone, pieces in distribution, total cost, actions
- [x] T037 [P] [US3] Update `frontend/components/cutting/CuttingSessionTable.tsx` — columns: date, model, total pieces, status, actions
- [x] T038 [P] [US3] Update `frontend/components/distribution/DistributionSummaryTable.tsx` — columns: tailor, pieces sent, pieces returned, cost, status, actions
- [x] T039 [P] [US3] Update `frontend/components/distribution/PiecesAvailabilityTable.tsx` (if present) — columns: model, part, size, color, available count; numeric column right-aligned
- [x] T040 [P] [US3] Update `frontend/components/qc/QcTable.tsx` — columns: date, model, pieces accepted, pieces rejected, actions
- [x] T041 [P] [US3] Update `frontend/components/finition/FinitionTable.tsx` (if present) — columns: date, model, pieces, status, actions
- [x] T042 [P] [US3] Update `frontend/components/final-stock/FinalStockTable.tsx` — columns: model, part, size, color, quantity; numeric columns right-aligned

**Checkpoint**: US3 complete. All tables have sticky headers and alternating rows. Action buttons appear only on row hover. Numeric columns are right-aligned in RTL layout.

---

## Phase 6: User Story 4 — Consistent Modals, Buttons & Forms (Priority: P4)

**Goal**: All modals have blur backdrop, fixed header with close button, scrollable body, and sticky footer. Multi-step modals show a step indicator. All form fields have label-above + focus ring + inline error. All buttons follow the 4-tier system.

**Independent Test**: Open the "Add Stock Item" modal. Verify: blurred backdrop, × close button in header, scrollable form body, Cancel + Confirm buttons pinned to the bottom. Submit empty form — see inline red error messages below each field.

- [x] T043 Create `frontend/components/shared/AppModal.tsx` — named export; props: `{ open, onClose, title, children, footer, size?, stepIndicator? }`; when `!open` returns null; renders: `<div>` fixed overlay with `inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center`; inner `<div>` with `bg-surface rounded-2xl shadow-2xl flex flex-col` and `max-h-[90vh]` + width controlled by `size` prop; header `<div>` with `flex items-center justify-between p-5 border-b border-border flex-shrink-0`: title as `<h2>` + close button (X icon, `onClick={onClose}`); optional `stepIndicator` rendered below the title row; scrollable body `<div className="overflow-y-auto flex-1 p-5">{children}</div>`; sticky footer `<div className="flex-shrink-0 p-4 border-t border-border">{footer}</div>`
- [x] T044 [P] Create `frontend/components/shared/StepIndicator.tsx` — named export; props: `{ steps: string[], currentStep: number }`; renders a horizontal row of step items; each step: step number circle (filled `bg-primary-500 text-white` if past/current, outlined `border-2 border-border text-text-muted` if future) + step label text; connector lines between steps; current step label in `font-semibold text-primary-600`; RTL layout
- [x] T045 [P] Create `frontend/components/shared/FormField.tsx` — named export; props: `{ label, error?, helper?, required?, children }`; renders: `<label>` with `text-sm font-medium text-text-base mb-1 block`; `required` adds `*` in red; `{children}` (the actual input element — passed as a child, not controlled internally); error `<p>` in `text-sm text-red-500 mt-1` when `error` is set; helper `<p>` in `text-sm text-text-muted mt-1` when `helper` is set and no error
- [x] T046 [P] [US4] Update `frontend/components/stock/AddItemModal.tsx` — replace the fixed overlay div pattern with `<AppModal>`; wrap each form field in `<FormField>`; pass the form's submit and cancel buttons to `footer` prop; ensure focus rings use `focus:ring-2 focus:ring-primary-500`
- [x] T047 [P] [US4] Update `frontend/components/stock/EditItemModal.tsx` — same pattern as T046
- [x] T048 [P] [US4] Update `frontend/components/stock/AddInboundModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T049 [P] [US4] Update `frontend/components/stock/EditTransactionModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T050 [P] [US4] Update `frontend/components/stock/NestedSupplierModal.tsx` (if present) — migrate to `AppModal`
- [x] T051 [P] [US4] Update `frontend/components/suppliers/AddSupplierModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T052 [P] [US4] Update `frontend/components/suppliers/EditSupplierModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T053 [P] [US4] Update `frontend/components/employees/AddEmployeeModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T054 [P] [US4] Update `frontend/components/employees/EditEmployeeModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T055 [P] [US4] Update `frontend/components/employees/AddOperationModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T056 [P] [US4] Update `frontend/components/employees/AddPaymentModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T057 [P] [US4] Update `frontend/components/employees/EditPaymentModal.tsx` (if present) — migrate to `AppModal` + `FormField`
- [x] T058 [P] [US4] Update `frontend/components/tailors/NewTailorModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T059 [P] [US4] Update `frontend/components/tailors/EditTailorModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T060 [P] [US4] Update `frontend/components/tailors/TailorPaymentModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T061 [P] [US4] Update `frontend/components/cutting/NewCuttingSessionModal.tsx` — migrate to `AppModal`; add `<StepIndicator>` in `stepIndicator` prop slot (steps: القص، الأجزاء، التأكيد or similar per existing steps); wrap each step's fields in `FormField`
- [x] T062 [P] [US4] Update `frontend/components/distribution/DistributeModal.tsx` — migrate to `AppModal`; add `<StepIndicator>` for multi-step flow; wrap fields in `FormField`
- [x] T063 [P] [US4] Update `frontend/components/distribution/ReturnModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T064 [P] [US4] Update `frontend/components/qc/AddQcRecordModal.tsx` — migrate to `AppModal` + `FormField`
- [x] T065 [P] [US4] Update `frontend/components/finition/AddFinitionRecordModal.tsx` (if present) — migrate to `AppModal` + `FormField`
- [x] T066 [P] [US4] Update `frontend/components/finition/AddToStockModal.tsx` (if present) — migrate to `AppModal` + `FormField`
- [x] T067 [P] [US4] Update `frontend/components/finition/AddStepModal.tsx` (if present) — migrate to `AppModal` + `FormField`
- [x] T068 [US4] Global button audit — search all components for `<button>` and anchor tags used as buttons; replace ad-hoc color classes with a consistent set: primary actions → `bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 font-medium`; secondary → `border border-primary-500 text-primary-600 hover:bg-primary-50 rounded-lg px-4 py-2`; ghost → `text-text-muted hover:text-text-base hover:bg-base/50 rounded-lg px-3 py-1.5`; danger → `bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2`; disabled state → `opacity-50 cursor-not-allowed`

**Checkpoint**: US4 complete. Open any modal — blur backdrop, fixed header, scrollable body, sticky footer. Submit empty form — inline red errors. All buttons visually consistent across all screens.

---

## Phase 7: User Story 5 — Empty States & Loading States (Priority: P5)

**Goal**: All data screens show a skeleton loader (not just a spinner) while data loads. All empty tables/lists show an icon, title, description, and CTA button — never a blank area.

**Independent Test**: Open the Stock screen before any items are added — see the empty state with CTA. On the Dashboard, observe the KPI area during load — see skeleton cards shaped like the KPI layout, not a spinner.

- [x] T069 Create `frontend/components/shared/SkeletonCard.tsx` — named export; props: `{ variant: 'kpi' | 'table' | 'form' | 'text', rows?: number }`; `kpi` variant: rounded card with animated pulse, two lines of varying width simulating value + label, small circle for icon; `table` variant: header bar + `rows` skeleton rows alternating width; `form` variant: stacked label+input pairs; `text` variant: paragraph lines; all use `bg-border animate-pulse rounded`; export also a named `SkeletonKpiGrid` convenience component that renders a `grid grid-cols-2 md:grid-cols-4 gap-4` of `SkeletonCard variant="kpi"`
- [x] T070 Update `frontend/components/shared/EmptyState.tsx` — audit the existing component; ensure it accepts: `{ icon: LucideIcon, title: string, description: string, action?: { label: string, onClick: () => void } }`; renders the icon in a light `bg-primary-50 text-primary-500` circle; `title` as `font-semibold text-text-base`; `description` as `text-sm text-text-muted`; `action` as a primary-styled button; if already compliant, no changes needed
- [x] T071 [P] [US5] Update `frontend/components/dashboard/DashboardKpiCards.tsx` — replace the existing loading state (if any) with `<SkeletonKpiGrid />` when `isLoading` is true from the `useDashboard` hook
- [x] T072 [P] [US5] Update `frontend/components/distribution/DistributionKpiCards.tsx` — replace existing pulse skeleton rows with `<SkeletonKpiGrid />` when loading
- [x] T073 [P] [US5] Audit `frontend/components/stock/StockTable.tsx` — pass `isLoading` and `skeletonRows={8}` to `DataTable`; ensure the existing `EmptyState` usage has an `action` prop pointing to the "add item" trigger
- [x] T074 [P] [US5] Audit `frontend/components/suppliers/SupplierTable.tsx` — pass loading state; ensure `EmptyState` has add-supplier CTA
- [x] T075 [P] [US5] Audit `frontend/components/employees/EmployeeTable.tsx` — pass loading state; ensure `EmptyState` has add-employee CTA
- [x] T076 [P] [US5] Audit `frontend/components/tailors/TailorTable.tsx` — pass loading state; ensure `EmptyState` has add-tailor CTA
- [x] T077 [P] [US5] Audit `frontend/components/cutting/CuttingSessionTable.tsx` — pass loading state; ensure `EmptyState` has "إنشاء جلسة قص" CTA
- [x] T078 [P] [US5] Audit `frontend/components/qc/QcTable.tsx` — pass loading state; ensure `EmptyState` has appropriate CTA
- [x] T079 [P] [US5] Audit `frontend/components/final-stock/FinalStockTable.tsx` — pass loading state; ensure `EmptyState` has appropriate CTA

**Checkpoint**: US5 complete. Every table shows a skeleton during load. Every empty table shows icon + title + description + CTA. No blank white areas or lone spinners for content sections.

---

## Phase 8: User Story 6 — Upgraded Sidebar Navigation (Priority: P6)

**Goal**: Sidebar shows the atelier logo (or app name) at the top, navigation items grouped under domain labels with a filled pill indicator for the active item, and the user's avatar + name + role + logout button at the bottom.

**Independent Test**: Open the app. Verify logo/name at top. Navigate between pages — active item gets filled pill in primary color. Check bottom — user name, role label, logout button all visible.

- [x] T080 [US6] Rewrite `frontend/components/layout/Sidebar.tsx` — structure: (1) **Header** — reads `useThemeStore.logo`; if set: renders `<img src={logo} alt="شعار" className="h-10 w-auto object-contain" />`; if not set: renders app name `"أتيلييه"` in `text-lg font-bold text-primary-600`; (2) **Navigation** — define `NAV_GROUPS` constant grouping nav items by domain (e.g., group `"الإنتاج"`: Dashboard, Cutting, Distribution, QC, Final Stock; group `"الإدارة"`: Employees, Tailors; group `"المبيعات"`: Suppliers, Stock; group `"الإعدادات"`: Settings); render each group with a muted group label (`text-xs font-semibold text-text-muted uppercase tracking-wide px-3 mb-1`) followed by its nav items; each nav item: `<Link>` wrapping a flex row with icon + label; active item: full pill `bg-primary-500 text-white rounded-lg px-3 py-2.5`; inactive item: `text-text-muted hover:bg-surface hover:text-text-base rounded-lg px-3 py-2.5`; icons always visible at `size={18}`; (3) **Footer** — reads `useAuthStore.currentUser`; renders avatar circle (initials from user name) in `bg-primary-50 text-primary-600`; user full name in `text-sm font-medium text-text-base`; role label in `text-xs text-text-muted`; logout `<button>` below with `text-red-500 hover:bg-red-50` styling; overall sidebar: `bg-surface border-l border-border` (left border = inner side in RTL)

**Checkpoint**: US6 complete. Sidebar has logo, grouped navigation, pill active state, and user info at bottom. Test by navigating all pages and verifying visual consistency.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final sweep to verify RTL consistency, semantic color usage, TypeScript hygiene, and flash-prevention correctness.

- [x] T081 RTL alignment audit — grep all new and modified components for `text-left`, `left-0`, `ml-`, `pl-` classes not intentionally overriding RTL; replace with RTL equivalents (`text-right`, `right-0`, `mr-`, `pr-`) or `start-`/`end-` logical properties where appropriate
- [x] T082 [P] Semantic color audit — search all components for hardcoded `text-green-*`, `text-red-*`, `text-amber-*`, `text-blue-*` used for semantic meaning; verify they still use fixed Tailwind colors (not primary vars) since semantic colors must NOT change with the primary color swatch
- [x] T083 [P] TypeScript strict compilation check — run `npx tsc --noEmit` from `frontend/`; fix any new `any` usages, missing return types, or import errors introduced by this feature
- [x] T084 [P] Dark mode visual pass — toggle `data-theme="dark"` manually in DevTools; walk all 9 screens; verify surfaces, borders, text, and shadows all use CSS var–based classes; fix any hardcoded `bg-white`, `text-gray-900`, `border-gray-200` that don't respond to dark mode
- [x] T085 Flash-prevention verification — in a built Electron app (`npm run build && npm run build:electron`), set `appearance_primary_color = 'rose'` and `appearance_theme = 'dark'` directly in the SQLite database; launch the app; verify the first paint is in rose + dark without any flash to the default blue + light theme
- [x] T086 Run the quickstart.md test checklist — execute every scenario in `specs/016-ui-overhaul-customization/quickstart.md` and confirm all pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user story phases**
- **US1 (Phase 3)**: Depends on Foundational — no dependency on other stories
- **US2 (Phase 4)**: Depends on Foundational — no dependency on US1
- **US3 (Phase 5)**: Depends on Foundational — no dependency on US1 or US2
- **US4 (Phase 6)**: Depends on Foundational — no dependency on earlier stories
- **US5 (Phase 7)**: Depends on Foundational + US3 DataTable (T032) for table skeleton integration
- **US6 (Phase 8)**: Depends on Foundational only
- **Polish (Phase 9)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational
- **US2 (P2)**: Independent after Foundational
- **US3 (P3)**: Independent after Foundational
- **US4 (P4)**: Independent after Foundational; modals benefit from US1 (AppCard) but are not blocked by it
- **US5 (P5)**: Depends on US3 (DataTable with `isLoading` prop); otherwise independent
- **US6 (P6)**: Independent after Foundational; reads `useThemeStore` logo (requires Foundational store)

### Within Each User Story

- Shared component creation (AppCard, AppModal, etc.) before module-level migration tasks
- All per-module tasks marked `[P]` within a story phase can execute in parallel

### Parallel Opportunities

- All `[P]` tasks within each phase can be launched simultaneously
- Once Foundational phase completes, **US1, US2, US3, US4, and US6 can all begin in parallel**
- US5 can begin after DataTable (T032) is complete — does not need full US3 completion

---

## Parallel Example: US4 (Modal Migrations)

```
# After T043 (AppModal), T044 (StepIndicator), T045 (FormField) are complete,
# all 22 modal migration tasks can run in parallel:

Task T046: Update AddItemModal.tsx
Task T047: Update EditItemModal.tsx
Task T048: Update AddInboundModal.tsx
Task T049: Update EditTransactionModal.tsx
Task T050: Update NestedSupplierModal.tsx
Task T051: Update AddSupplierModal.tsx
... (all [P] tasks simultaneously)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T012) — critical CSS + backend
3. Complete Phase 3: US1 (T013–T027) — every screen gets card layout + PageHeader + KpiCard
4. **STOP and VALIDATE**: All screens look professional with card layout and KPI cards
5. Deploy/demo Phase 3 result

### Incremental Delivery

1. Foundation → US1 (visual baseline) → demo
2. Add US2 (customization) → logo + theme + color picker works end-to-end → demo
3. Add US3 (tables) → all tables upgraded → demo
4. Add US4 (modals) → all modals upgraded → demo
5. Add US5 (empty/loading states) → polish UX → demo
6. Add US6 (sidebar) → navigation redesign → demo
7. Polish phase → ship

### Single Developer Sequence

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9

---

## Notes

- `[P]` tasks = different files, no cross-task dependency within the same phase
- `[Story]` label maps task to specific user story for traceability
- Each user story phase is independently completable and testable
- The CSS foundation (T004) is the single most critical task — everything downstream depends on it
- Total tasks: **86** (T001–T086)
- Modal tasks (T046–T067): verify exact file names exist before starting; skip any that don't exist in the codebase
- For any `[P]` block where all tasks touch the same shared file (e.g., common.json), serialize those specific tasks
