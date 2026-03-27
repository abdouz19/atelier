# Research: UI/UX Enhancement & Platform Customization

**Branch**: `016-ui-overhaul-customization` | **Phase**: 0 | **Date**: 2026-03-27

---

## Decision 1: CSS Custom Properties + Tailwind v4 Theming Architecture

**Decision**: Use CSS custom property layers with `data-*` attributes on `<html>` to drive dynamic theming. Tailwind v4's `@theme inline` block maps Tailwind color tokens to these variables, so build-time utilities stay static while runtime color values change.

**How it works:**

```css
/* globals.css — defines 6 palettes under data-primary attribute selectors */
[data-primary="blue"]    { --primary-50: #eff6ff; --primary-500: #3b82f6; --primary-600: #2563eb; }
[data-primary="indigo"]  { --primary-50: #eef2ff; --primary-500: #6366f1; --primary-600: #4f46e5; }
/* ... 4 more palettes ... */

/* Dark mode surfaces */
[data-theme="dark"] {
  --bg-base: #0f172a;
  --bg-surface: #1e293b;
  --border-default: #334155;
  --text-primary: #f1f5f9;
  --text-muted: #94a3b8;
  --shadow-opacity: 0.4;
}

/* @theme inline maps Tailwind tokens → CSS vars → runtime values */
@theme inline {
  --color-primary-50:  var(--primary-50);
  --color-primary-500: var(--primary-500);
  --color-primary-600: var(--primary-600);
  --color-surface:     var(--bg-surface);
  --color-base:        var(--bg-base);
}
```

Components use `bg-primary-500`, `text-primary-600`, `border-primary-500` as standard Tailwind utilities. Selecting a new color swatch updates the `data-primary` attribute on `<html>` — all components update instantly with zero per-component changes.

**Rationale**: Tailwind v4 is built for exactly this pattern. The chain `utility class → @theme CSS var → runtime CSS var → data-attribute` compiles entirely at build time while the leaf values remain dynamic.

**Alternatives considered**:
- *Inline styles on each component*: Rejected — violates constitution (no inline styles), unmanageable at scale across 50+ components.
- *next-themes library*: Rejected — adds a dependency; overkill for Electron where there is no SSR flash issue. Also next-themes is designed for SSR/SSG, not static Electron export.
- *CSS class swapping (`.theme-blue`, `.theme-dark`)*: Viable but produces larger CSS output and requires qualifying every selector. Data attributes are cleaner for Tailwind v4.

---

## Decision 2: Theme Initialization Without Flash (Electron-Specific)

**Decision**: Use synchronous IPC (`ipcRenderer.sendSync`) in the preload script to read appearance settings from SQLite before the renderer process starts, exposing them as `window.__APPEARANCE__`. The root `layout.tsx` reads this on first render and injects `data-primary` and `data-theme` on `<html>` before React hydration paints.

**How it works:**

```typescript
// electron/preload/index.ts — read synchronously before renderer init
const appearance = ipcRenderer.sendSync('settings:getAppearanceSync');
window.__APPEARANCE__ = appearance; // { theme: 'dark', primaryColor: 'indigo', logo: '...' }

// frontend/app/layout.tsx — server-compatible inline script
<script dangerouslySetInnerHTML={{ __html: `
  const a = window.__APPEARANCE__ || {};
  document.documentElement.setAttribute('data-primary', a.primaryColor || 'blue');
  document.documentElement.setAttribute('data-theme',   a.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : (a.theme || 'light'));
` }} />
```

**Rationale**: In Electron there is no server-side render and no HTTP request latency. The preload script runs synchronously in the main process context before renderer JS executes. This gives us zero-flash theme application without any `localStorage` usage (prohibited by constitution).

**Alternatives considered**:
- *localStorage for quick theme read*: Rejected — constitution explicitly prohibits `localStorage` for persistent data; all persistent state goes through SQLite.
- *Async IPC + Zustand load on mount*: Results in a visible flash from default theme to user theme on every app start. Unacceptable for a professional tool.
- *Hardcode theme values into preload at build time*: Rejected — would require a rebuild whenever the user changes their preference.

---

## Decision 3: Logo Storage in SQLite

**Decision**: Store the logo as a base64-encoded data URL string in `app_settings` under key `appearance_logo`. Maximum accepted file size is 2MB (produces ~2.7MB of base64 text). SQLite stores TEXT up to 1GB — acceptable for a desktop app with a single user.

**Upload flow**: Renderer reads file via `<input type="file">` → converts to base64 data URL → sends to IPC handler → stored in `app_settings`. On load, the base64 string is returned via IPC and used as `<img src={logo} />` directly.

**Rationale**: Electron apps have full filesystem access, but storing in SQLite keeps all persistence in one place (no orphaned files, no path management). base64 inline images are standard for logo-sized assets.

**Alternatives considered**:
- *Copy file to userData directory, store path in app_settings*: More complex (file management, copy logic, cleanup on remove). Rejected for simplicity.
- *Electron's `nativeImage`*: Only needed for tray/dock icons, not renderer images. Rejected.

---

## Decision 4: Topbar Removal

**Decision**: Remove `Topbar.tsx` from `AppLayout`. Its responsibilities are redistributed: the app name/logo moves to the Sidebar top, and the user avatar/name/role moves to the Sidebar bottom. Each page's content uses a new `PageHeader` component for its title and primary action CTA.

**New AppLayout:**
```tsx
<div className="flex h-screen overflow-hidden" dir="rtl">
  <Sidebar />
  <main className="flex-1 overflow-auto bg-base">{children}</main>
</div>
```

**Rationale**: The Topbar was only displaying the app name and user info — both of which now live in the redesigned Sidebar. Removing it gives the main content area ~56px more vertical space, reducing clutter and following the spec's described layout rhythm (screen title is the first thing in the content area, not a persistent topbar above it).

**Alternatives considered**:
- *Keep Topbar as a breadcrumb bar*: Breadcrumbs are not mentioned in the spec. Adding unrequested features is prohibited by constitution principles.
- *Repurpose Topbar as search bar*: Not in scope for this feature.

---

## Decision 5: Shared Component Architecture (New vs Upgrade)

**Decision**: Introduce a set of new shared components in `frontend/components/shared/` that establish the design system. Existing per-module components are **upgraded in place** to use these shared primitives. No existing component is deleted — each is refactored.

**New shared components:**

| Component | Purpose | Replaces |
|-----------|---------|---------|
| `PageHeader` | Screen title + CTA slot | Inline `<h1>` in every page |
| `AppCard` | Card wrapper (surface bg, shadow, rounded) | Ad-hoc `bg-white rounded-xl` divs |
| `KpiCard` | Upgraded KPI metric card with trend + colored border | `DashboardKpiCards.tsx` internal `KpiCard` |
| `DataTable` | Table wrapper: sticky header, alternating rows | Plain `<table>` in every module |
| `AppModal` | Modal base: blur backdrop, scrollable body, sticky footer | Duplicated modal pattern across 20+ modals |
| `StepIndicator` | Step header for multi-step modals | None (new) |
| `FormField` | Label + input + error slot | Duplicated field markup in every form |
| `SkeletonCard` | Skeleton loader shapes | Ad-hoc pulse divs |

**Rationale**: Creating shared primitives first means every module upgrade becomes a mechanical substitution (swap custom markup for the shared component). This also means future features automatically get the new design for free.

**Alternatives considered**:
- *Upgrade each component in isolation*: Leads to inconsistent results; each developer/feature branch re-solves the same problems differently.
- *Add shadcn/ui*: Would add hundreds of components, a new dependency, and require adapting to shadcn's API. The existing components/ui/ folder is empty and unused. Constitution doesn't list shadcn as a required tool. Rejected.

---

## Decision 6: Dark Mode Implementation

**Decision**: Use `[data-theme="dark"]` CSS attribute selector to override surface and text CSS custom properties. No JavaScript theme toggling library needed — setting the attribute on `<html>` is sufficient.

**System theme detection:**
```typescript
// When user selects 'system', listen for OS preference changes
const mq = window.matchMedia('(prefers-color-scheme: dark)');
mq.addEventListener('change', (e) => {
  document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
});
```

**Dark mode CSS variable overrides:**
```css
[data-theme="dark"] {
  --bg-base:      #0f172a;   /* slate-950 */
  --bg-surface:   #1e293b;   /* slate-800 */
  --border-color: #334155;   /* slate-700 */
  --text-base:    #f1f5f9;   /* slate-100 */
  --text-muted:   #94a3b8;   /* slate-400 */
}
/* Primary color accent adjusts for readability on dark surfaces */
[data-theme="dark"][data-primary="blue"]    { --primary-500: #60a5fa; } /* blue-400 — lighter on dark */
[data-theme="dark"][data-primary="indigo"]  { --primary-500: #818cf8; }
/* ... etc. */
```

**Rationale**: Single attribute on `<html>` cascades everywhere without per-component dark variants. The Tailwind `dark:` variant strategy would require adding `dark:` prefixes to every class in every component — not feasible for a retrofit of this scale.

---

## Decision 7: New IPC Namespace for Settings

**Decision**: Add a dedicated `settings` namespace to the IPC bridge. Sync variant (`settings:getAppearanceSync`) used only in preload for flash-free init; async variants used for all renderer-side reads and writes.

**New channels:**
- `settings:getAppearanceSync` — sync only (preload init)
- `settings:getAppearance` — async read
- `settings:setAppearance` — async write (theme + primaryColor together)
- `settings:getLogo` — async read (returns base64 data URL or null)
- `settings:setLogo` — async write (accepts base64 data URL, validates size/format)
- `settings:removeLogo` — async delete
- `settings:resetToDefaults` — async: removes all appearance keys, returns defaults

**Rationale**: Separating logo from appearance reduces payload size on `getAppearance` calls (logo not needed for most reads). `resetToDefaults` as a single atomic call matches the spec requirement for one-step reset.
