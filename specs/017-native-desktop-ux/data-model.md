# Data Model: Native Desktop UI/UX Overhaul

**Feature**: 017-native-desktop-ux
**Date**: 2026-03-28

## Overview

This feature introduces no new database tables and requires no schema migrations. All data persistence for theming (dark/light mode, primary color) is already handled by the `app_settings` table introduced in feature 012 and extended in feature 016.

## Existing Entities Used

### `app_settings` (existing, no changes)

Stores key-value pairs for persistent application configuration. Relevant keys for this feature:

| Key | Type | Values | Description |
|-----|------|--------|-------------|
| `theme` | `TEXT` | `'light'`, `'dark'`, `'system'` | Controls `data-theme` attribute on `<html>`. `'system'` defers to OS `prefers-color-scheme`. |
| `primaryColor` | `TEXT` | `'blue'`, `'indigo'`, `'emerald'`, `'rose'`, `'amber'`, `'slate'` | Controls `data-primary` attribute on `<html>`. |
| `logo` | `TEXT` | Base64 data URL or `null` | Custom logo displayed in sidebar header. |

**Read path**: On app launch, the Electron main process reads these settings and injects them into the renderer via `window.__APPEARANCE__`. The inline `themeInitScript` in `app/layout.tsx` reads this object and sets the `data-*` attributes synchronously before React hydrates, preventing flash of unstyled content.

**Write path**: Settings page → `useSettings` hook → IPC → `settings.handler.ts` → `settings.service.ts` → `app_settings` table. No changes to this path in this feature.

## UI State (in-memory, no persistence)

| State | Location | Type | Description |
|-------|----------|------|-------------|
| `pathname` | `usePathname()` hook | `string` | Current route — drives active pill position in Sidebar |
| Page transition key | `PageTransition` component | `string` (pathname) | Triggers `AnimatePresence` exit/enter on route change |
| Login error | `useAuth()` hook → `LoginForm` | `string \| null` | Drives shake animation on auth failure |

## No New Migrations

```
No SQL migration files required for this feature.
```
