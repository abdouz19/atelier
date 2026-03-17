# Quickstart: User Authentication & App Shell

## Overview
This feature implements the core authentication system and the application's shell layout (Sidebar and Topbar).

## Core Dependencies
- `argon2`: Password hashing (Electron main process).
- `zustand`: Auth state management (Renderer).
- `lucide-react`: Icons for sidebar and topbar.

## Setup
1. **Database Seed**: The application seeds a default admin account (`admin` / `Admin123!`) on the first launch.
2. **IPC Integration**: `ipc-client.ts` must expose `auth` and `user` channels.
3. **Protected Routes**: All pages under `/app/(dashboard)/*` require an active session.

## Key Components
- `src/components/auth/LoginForm.tsx`: Handles credentials input and IPC call.
- `src/components/layout/AppLayout.tsx`: The primary wrapper for dashboard pages.
- `src/components/layout/Sidebar.tsx`: The right-aligned navigation menu.
- `src/components/layout/Topbar.tsx`: The topbar with profile and search.

## Verification
- Run `npm test` for Vitest units (AuthService, Queries).
- Run `npx playwright test` for E2E login/logout flows.
- Confirm sidebar aligns to the **right** and follows Arabic text direction.
