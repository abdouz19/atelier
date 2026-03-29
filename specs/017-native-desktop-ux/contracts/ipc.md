# IPC Contracts: Native Desktop UI/UX Overhaul

**Feature**: 017-native-desktop-ux
**Date**: 2026-03-28

## Overview

This feature introduces **no new IPC channels**. All theme/settings IPC already exists from features 012 and 016. This document records the existing contracts that this feature relies on.

## Existing IPC Channels Used (read-only)

### `SETTINGS:GET_APPEARANCE` (existing)

**Direction**: Renderer → Main
**Handler**: `electron/ipc/settings.handler.ts`
**Purpose**: Read current theme, primaryColor, and logo from `app_settings`.

**Request**: No payload.

**Response**:
```ts
{ success: true; data: { theme: 'light' | 'dark' | 'system'; primaryColor: string; logo: string | null } }
| { success: false; error: string }
```

### `window.__APPEARANCE__` injection (existing)

**Direction**: Main process → Renderer (startup-time injection)
**Purpose**: Pre-hydration theme initialization. The main process reads `app_settings` on startup and injects values into `window.__APPEARANCE__` before the renderer loads, enabling the inline `themeInitScript` in `app/layout.tsx` to set `data-theme` and `data-primary` on `<html>` synchronously.

**Shape**:
```ts
window.__APPEARANCE__ = {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  logo: string | null;
}
```

## No New Contracts

No new IPC channels, no new Electron API surface, and no new preload bridge methods are introduced by this feature.
