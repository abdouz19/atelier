# Implementation Plan: UI/UX Enhancement & Platform Customization

**Branch**: `016-ui-overhaul-customization` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/016-ui-overhaul-customization/spec.md`

---

## Summary

A full visual overhaul of the Atelier platform — touching every screen — to establish a professional operations-tool aesthetic through a shared design system (card layouts, KPI cards with trends, upgraded tables and modals, consistent typography). Paired with a platform customization section in Settings: logo upload, light/dark/system theme toggle, and a 6-swatch primary color picker. Theming uses CSS custom properties driven by `data-primary` and `data-theme` attributes on `<html>`, so a single Tailwind build serves all runtime color variants. Settings persist in the existing SQLite `app_settings` table and are loaded synchronously in the Electron preload script to prevent any flash-of-unstyled-content on startup.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict) — renderer; Node.js plain JavaScript — Electron main process
**Primary Dependencies**: Next.js 14 (App Router, `output: export`), Electron 41, better-sqlite3, react-hook-form + Zod 4, Tailwind CSS 4, Lucide React, Zustand 5, Recharts
**Storage**: SQLite via better-sqlite3 (plain JS prepared statements in `electron/main.js`); no new tables — three new keys in existing `app_settings` table: `appearance_theme`, `appearance_primary_color`, `appearance_logo`
**Testing**: Manual testing via `npm run dev:electron`; TypeScript strict-mode compilation as primary correctness gate
**Target Platform**: Electron 41 desktop app (Windows/macOS/Linux); Next.js static export loaded via `file://`
**Project Type**: Desktop app (Electron + Next.js renderer)
**Performance Goals**: Theme attribute change must cascade to all visible components within one frame; no perceptible layout shift during skeleton → content transition
**Constraints**: No `localStorage` (constitution prohibition); no server-side rendering (static export); all persistence through SQLite; no new npm dependencies required
**Scale/Scope**: ~50 React components upgraded; ~10 pages retrofitted; 8 new shared components created; 3 new SQLite keys; 7 new IPC channels

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **Core Data Flow** | ✅ PASS | Appearance settings flow: `useAppearanceSettings` hook → `ipcClient.settings.*` → preload bridge → `settings.handler.js` → `service.js` → `queries.js` → SQLite |
| **Component & Page Discipline** | ✅ PASS | All new shared components are pure UI (no logic). All new hooks are logic-only (no JSX). Pages call hooks, compose layout. Topbar deletion reduces component count rather than adding complexity. |
| **Type Safety** | ✅ PASS | `ThemeMode` and `PrimaryColor` as `const` enum-like string literals. Zod schema validates all form input before IPC call. No `any`, no `@ts-ignore`. |
| **RTL & Localization First** | ✅ PASS | All new component text externalized to `public/locales/ar/settings.json`. `dir="rtl"` preserved on root layout. New components use RTL-aware alignment defaults. |
| **UI/UX Consistency** | ✅ PASS | This feature IS the consistency overhaul. All new components follow the spec: skeleton loaders, empty states with CTA, `ConfirmDialog` for reset action, react-hook-form + Zod for settings form, toast on save. |
| **NEVER localStorage** | ✅ PASS | All persistence via SQLite `app_settings`. Theme seed for flash prevention uses synchronous IPC read in preload (not localStorage). |
| **NEVER prop drilling > 3 levels** | ✅ PASS | Theme state lives in `useThemeStore` (Zustand). Components read from store directly — no prop drilling. |
| **NEVER useEffect for data fetching** | ✅ PASS | `useAppearanceSettings` hook handles IPC data fetching without bare `useEffect`. |
| **NEVER hardcoded strings in JSX** | ✅ PASS | All new Arabic strings in `public/locales/ar/settings.json` and `common.json`. |

**Gate Result**: PASS — no violations. Proceed to implementation.

---

## Project Structure

### Documentation (this feature)

```text
specs/016-ui-overhaul-customization/
├── plan.md              ← This file
├── research.md          ← Phase 0: 7 key decisions resolved
├── data-model.md        ← Phase 1: types, CSS vars, component contracts, upgrade map
├── quickstart.md        ← Phase 1: how to run and test
├── contracts/
│   └── ipc-settings.md  ← Phase 1: all 7 IPC channel contracts
└── tasks.md             ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code

```text
frontend/
├── app/
│   ├── globals.css                          ← MODIFY: CSS variable themes + dark mode + @theme inline
│   ├── layout.tsx                           ← MODIFY: inline <script> for flash-free theme init
│   └── (dashboard)/
│       ├── layout.tsx                       ← MODIFY: remove Topbar from AppLayout
│       ├── dashboard/page.tsx               ← MODIFY: PageHeader + AppCard wrapper
│       ├── stock/page.tsx                   ← MODIFY: PageHeader + AppCard wrapper
│       ├── suppliers/page.tsx               ← MODIFY: PageHeader + AppCard wrapper
│       ├── employees/page.tsx               ← MODIFY: PageHeader + AppCard wrapper
│       ├── tailors/page.tsx                 ← MODIFY: PageHeader + AppCard wrapper
│       ├── cutting/page.tsx                 ← MODIFY: PageHeader + AppCard wrapper
│       ├── distribution/page.tsx            ← MODIFY: PageHeader + AppCard wrapper
│       ├── qc/page.tsx                      ← MODIFY: PageHeader + AppCard wrapper
│       ├── final-stock/page.tsx             ← MODIFY: PageHeader + AppCard wrapper
│       └── settings/page.tsx               ← MODIFY: add AppearanceSettings section
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                      ← OVERHAUL: logo top, grouped nav, pill indicator, user bottom
│   │   ├── AppLayout.tsx                    ← MODIFY: remove Topbar integration
│   │   └── Topbar.tsx                       ← DELETE: responsibilities redistributed
│   │
│   ├── shared/
│   │   ├── PageHeader.tsx                   ← NEW: title + subtitle + actions slot
│   │   ├── AppCard.tsx                      ← NEW: surface card wrapper
│   │   ├── KpiCard.tsx                      ← NEW: unified KPI card (trend, colored border, icon)
│   │   ├── DataTable.tsx                    ← NEW: sticky header, alternating rows, hover, empty state
│   │   ├── AppModal.tsx                     ← NEW: blur backdrop, scrollable body, sticky footer
│   │   ├── StepIndicator.tsx                ← NEW: multi-step progress in modal header
│   │   ├── FormField.tsx                    ← NEW: label + input slot + error + helper
│   │   ├── SkeletonCard.tsx                 ← NEW: kpi / table / form skeleton variants
│   │   ├── EmptyState.tsx                   ← UPGRADE: already exists; ensure CTA slot + icon
│   │   └── ConfirmDialog.tsx                ← UPGRADE: ensure RTL layout (already exists)
│   │
│   ├── dashboard/
│   │   └── DashboardKpiCards.tsx            ← UPGRADE: use new KpiCard component
│   │
│   ├── stock/ suppliers/ employees/ tailors/
│   │ cutting/ distribution/ qc/ finition/ final-stock/
│   │   └── [*Modal.tsx × 20]               ← UPGRADE: refactor to use AppModal
│   │   └── [*Table.tsx × 10]               ← UPGRADE: refactor to use DataTable
│   │
│   └── settings/
│       ├── AppearanceSettings.tsx           ← NEW: logo + theme + color picker + save/reset
│       └── LivePreview.tsx                  ← NEW: real-time preview panel (sidebar item + KPI card + button)
│
├── store/
│   └── useThemeStore.ts                     ← NEW: theme state + applyToDocument()
│
├── hooks/
│   └── useAppearanceSettings.ts             ← NEW: IPC hook (load + save + logo + reset)
│
├── features/
│   └── settings/
│       └── settings.types.ts               ← NEW: ThemeMode, PrimaryColor, AppearanceSettings, Zod schema
│
└── public/locales/ar/
    ├── common.json                          ← MODIFY: add sidebar group labels + new shared UI strings
    └── settings.json                        ← NEW: all customization section strings

electron/
├── features/
│   └── settings/
│       ├── queries.js                       ← NEW: getAppearance, setAppearance, getLogo, setLogo, removeLogo, reset
│       └── service.js                       ← NEW: validateAppearanceSettings, validateLogoUpload
│
├── ipc/
│   └── settings.handler.js                  ← NEW: registers all settings:* IPC channels
│
└── preload/
    └── index.ts                             ← MODIFY: add settings namespace + getAppearanceSync (sendSync)
```

**Structure Decision**: Single project (Electron + Next.js). No new directories at the repo root. All new code is additive within existing `frontend/` and `electron/` trees. The `components/ui/` folder remains empty — no UI library is introduced.

---

## Complexity Tracking

> No constitution violations requiring justification. This section is not applicable.

---

## Phase 0 Summary: Research Decisions

All resolved — see [research.md](./research.md) for full rationale.

| Decision | Chosen Approach |
|---------|----------------|
| CSS theming | `[data-primary]` + `[data-theme]` attribute selectors → Tailwind `@theme inline` token mapping |
| Flash prevention | `ipcRenderer.sendSync` in preload → `window.__APPEARANCE__` → inline `<script>` in `layout.tsx` |
| Logo storage | Base64 data URL in `app_settings` table key `appearance_logo` (≤ 2MB) |
| Topbar | Deleted; responsibilities moved to Sidebar (logo) and per-page PageHeader (title/CTA) |
| Dark mode | `[data-theme="dark"]` CSS overrides; adjusted primary palette shades for dark surface readability |
| Shared components | 8 new primitives in `components/shared/`; per-module components upgraded to use them |
| IPC namespace | New `settings` namespace; sync channel for preload init; async channels for all renderer operations |

---

## Phase 1 Design: Key Architectural Flows

### Flow A: App Startup — Flash-Free Theme Application

```
1. Electron launches → preload/index.ts runs synchronously
2. ipcRenderer.sendSync('settings:getAppearanceSync')
   → main.js handles synchronously via ipcMain.on (not handle)
   → reads app_settings for appearance_theme + appearance_primary_color
   → returns { theme, primaryColor } (defaults if absent)
3. preload sets: window.__APPEARANCE__ = { theme, primaryColor, logo: null }
4. React renderer starts → app/layout.tsx renders
5. Inline <script> (runs before React hydration):
   - reads window.__APPEARANCE__
   - sets document.documentElement.dataset.primary = primaryColor
   - sets document.documentElement.dataset.theme = (theme === 'system' ? detect from matchMedia : theme)
6. CSS cascade applies immediately — user sees correct theme from first paint
```

### Flow B: User Changes Primary Color in Live Preview

```
1. User clicks a color swatch in AppearanceSettings
2. AppearanceSettings calls useThemeStore.setPrimaryColor(newColor)
3. useThemeStore.applyToDocument() runs:
   - document.documentElement.dataset.primary = newColor
4. CSS custom property cascade updates ALL components instantly (no React re-render needed)
5. LivePreview also reads from useThemeStore → re-renders its preview elements
6. State is staged (not saved) — user sees the change everywhere, Save not yet called
```

### Flow C: User Saves Appearance Settings

```
1. User clicks "حفظ" → AppearanceSettings submits form
2. Zod validation on { theme, primaryColor }
3. ipcClient.settings.setAppearance({ theme, primaryColor })
   → IPC → settings.handler.js → service.js (validates) → queries.js
   → INSERT OR REPLACE into app_settings for both keys
4. Separately: if logo was changed, ipcClient.settings.setLogo({ dataUrl }) or removeLogo()
5. On success: toast notification (حُفظت الإعدادات)
6. useThemeStore.loadFromSettings(result) → applyToDocument() confirms final state
```

### Flow D: Reset to Defaults

```
1. User clicks "استعادة الإعدادات الافتراضية"
2. ConfirmDialog opens ("هل تريد إعادة تعيين جميع إعدادات التخصيص؟")
3. User confirms → ipcClient.settings.resetToDefaults()
   → IPC → queries.js: DELETE or UPDATE all three appearance keys to defaults
   → returns { theme: 'system', primaryColor: 'blue', logo: null }
4. useThemeStore.loadFromSettings(defaults) → applyToDocument()
5. LivePreview and Sidebar update instantly
6. Toast: "تمت استعادة الإعدادات الافتراضية"
```

---

## Phase 1 Artifacts

- ✅ [research.md](./research.md) — 7 key technical decisions
- ✅ [data-model.md](./data-model.md) — types, CSS vars, component contracts, upgrade map
- ✅ [contracts/ipc-settings.md](./contracts/ipc-settings.md) — all 7 IPC channel contracts
- ✅ [quickstart.md](./quickstart.md) — how to run and test the feature

---

## Implementation Sequence (for /speckit.tasks)

The tasks should be generated in this dependency order:

1. **CSS foundation** — `globals.css` with all color palettes, dark mode vars, and `@theme inline` mapping. Everything else depends on this being in place.

2. **Theme store + types** — `useThemeStore.ts`, `settings.types.ts`. Independent of backend work.

3. **Electron settings backend** — `queries.js`, `service.js`, `settings.handler.js`, preload bridge extension. Independent of frontend component work.

4. **New shared components** — `AppCard`, `PageHeader`, `FormField`, `AppModal`, `StepIndicator`, `SkeletonCard`, `KpiCard`, `DataTable`. Each is independent of the others; all depend on CSS foundation.

5. **Sidebar overhaul + AppLayout update** — depends on CSS foundation and theme store.

6. **useAppearanceSettings hook + AppearanceSettings + LivePreview** — depends on theme store, IPC backend, and shared components.

7. **Settings page integration** — depends on all settings components.

8. **Per-module upgrades** — each module (stock, suppliers, employees, etc.) gets its page and components upgraded. These are independent of each other; all depend on shared components.

9. **Localization** — `settings.json` + `common.json` additions. Should be done alongside each UI piece but can be a final sweep.

10. **Root layout flash-prevention** — `app/layout.tsx` inline script + preload sync IPC. Depends on all backend work being in place.
