# Tasks: User Authentication & App Shell

**Input**: Design documents from `/specs/001-user-auth/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/auth.ipc.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

> **Path note**: Constitution's `src/` → actual `frontend/`. Main process code → `electron/`. IPC handlers are implemented inline in `electron/main.js` (plain JS) rather than as separate TypeScript service files, to match the project's CommonJS Electron entry point.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure global project settings

- [X] T001 Install Electron main-process dependencies: `argon2`, `better-sqlite3` in root `package.json`; rebuild for Electron v41 ABI via `@electron/rebuild`
- [X] T002 [P] Configure Tailwind CSS v4 RTL support — `dir="rtl"` enforced on root `<html>` in `frontend/app/layout.tsx` (Tailwind v4 uses CSS-first config, no `tailwind.config.ts` needed)
- [X] T003 [P] Initialize Arabic localization files `frontend/public/locales/ar/common.json` and `frontend/public/locales/ar/auth.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 DB schema + migrations implemented inline in `electron/main.js` using `better-sqlite3` `CREATE TABLE IF NOT EXISTS` (no Drizzle in main.js to avoid ESM/CJS mismatch)
- [X] T005 [P] User entity schema: id, username, password_hash, full_name, role, avatar_url, created_at, updated_at — defined in `electron/db/schema/user.ts` (TypeScript reference) and implemented in `electron/main.js`
- [X] T006 [P] Session entity schema — defined in `electron/db/schema/session.ts` and implemented in `electron/main.js`
- [X] T007 [P] AuditLog entity schema — defined in `electron/db/schema/audit_log.ts` and implemented in `electron/main.js`
- [X] T008 SQLite database initialized via `initDB()` in `electron/main.js` using `app.getPath('userData')` for the DB file path
- [X] T009 Shared auth TypeScript types (User, IpcResponse, LoginPayload, ChangePasswordPayload, Window.ipcBridge) in `frontend/features/auth/auth.types.ts`
- [X] T010 Electron preload script exposing typed IPC bridge via `contextBridge.exposeInMainWorld` in `electron/preload.js`
- [X] T011 IPC client wrapper in `frontend/lib/ipc-client.ts` exposing `auth.login`, `auth.logout`, `auth.checkSession`, `user.changePassword`

**Checkpoint**: Foundation ready — database schema, IPC bridge, and types are in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Secure Login (Priority: P1) 🎯 MVP

**Goal**: A user can open the app, see a login screen, enter valid credentials, and be redirected to the dashboard. Invalid credentials show an inline error.

**Independent Test**: Launch the app unauthenticated → verify login screen appears. Enter `admin`/`Admin123!` → verify redirect to `/dashboard`. Enter wrong password → verify inline error message is shown without redirect.

### Implementation for User Story 1

- [X] T012 [P] [US1] Auth queries implemented inline in `electron/main.js`: user lookup by username, session creation, session lookup by token
- [X] T013 [P] [US1] Auth business logic in `electron/main.js`: login (Argon2id verify + audit log on success/failure) + `seedAdminIfEmpty()` (hashes `Admin123!` with argon2id)
- [X] T014 [US1] `auth:login` IPC handler registered in `electron/main.js` via `registerIpcHandlers()`
- [X] T015 [P] [US1] Zustand auth store (`isAuthenticated`, `currentUser`, `sessionToken`, `setAuth`, `clearAuth`) in `frontend/store/useAuthStore.ts`
- [X] T016 [US1] `useAuth` hook calling `ipcClient.auth.login` and updating Zustand store in `frontend/hooks/useAuth.ts` — redirects to `/dashboard` on success
- [X] T017 [US1] `LoginForm` component using react-hook-form + Zod (username required, password required) with inline error display in `frontend/components/auth/LoginForm.tsx`
- [X] T018 [US1] Login page rendering `LoginForm` at `frontend/app/(auth)/login/page.tsx`
- [X] T019 [US1] Set `lang="ar"` and `dir="rtl"` on root `<html>` in `frontend/app/layout.tsx`; root `app/page.tsx` is a client-side redirect to `/login` (compatible with `output: 'export'`)
- [X] T020 [US1] `app.whenReady()` in `electron/main.js` calls `initDB()`, `seedAdminIfEmpty()`, `registerIpcHandlers()`, then `createWindow()`

**Checkpoint**: User Story 1 fully functional — login screen renders, valid credentials grant dashboard access, invalid credentials show inline error.

---

## Phase 4: User Story 2 — Protected Access (Priority: P1)

**Goal**: All dashboard routes redirect unauthenticated users to `/login`. There is no way to reach a dashboard page without an active session.

**Independent Test**: While logged out, navigate directly to `/dashboard` or `/settings` → verify automatic redirect to `/login`.

### Implementation for User Story 2

- [X] T021 [US2] `AuthGuard` client component: checks `auth:checkSession` IPC on mount, hydrates store if valid, redirects to `/login` if invalid, listens for `AUTH_SESSION_EXPIRED` push event in `frontend/components/auth/AuthGuard.tsx`
- [X] T022 [US2] Dashboard route group layout wrapping all pages in `AuthGuard` + `AppLayout` in `frontend/app/(dashboard)/layout.tsx`
- [X] T023 [P] [US2] Placeholder dashboard page at `frontend/app/(dashboard)/dashboard/page.tsx` (route: `/dashboard`)

**Checkpoint**: User Story 2 complete — direct URL access to dashboard routes is blocked and unauthenticated users are always redirected to login.

---

## Phase 5: User Story 3 — Persistent Session (Priority: P2)

**Goal**: A user who has previously logged in is taken directly to the dashboard on app restart without re-entering credentials.

**Independent Test**: Log in, quit the Electron app, relaunch → verify user lands on dashboard without seeing the login screen.

### Implementation for User Story 3

- [X] T024 [US3] `auth:checkSession` IPC handler in `electron/main.js`: looks up active session token in SQLite, updates `last_accessed`, returns user or error
- [X] T025 [US3] Session token persisted in `currentToken` module variable in `electron/main.js`; survives app restarts via SQLite (token written to DB on login)
- [X] T026 [US3] `AuthGuard` calls `ipcClient.auth.checkSession()` on mount, hydrates Zustand store with returned user, redirects to `/login` only if check fails

**Checkpoint**: User Story 3 complete — session survives Electron restart and user is automatically taken to dashboard.

---

## Phase 6: User Story 4 — Secure Logout (Priority: P2)

**Goal**: The user can click a logout button in the sidebar, which invalidates the session and redirects to the login screen.

**Independent Test**: While logged in, click the sidebar logout button → verify redirect to `/login` and confirm that navigating back to `/dashboard` redirects to `/login` again.

### Implementation for User Story 4

- [X] T027 [US4] `auth:logout` IPC handler in `electron/main.js`: deletes active session from SQLite and writes logout audit log entry, clears `currentToken`
- [X] T028 [US4] `logout` action in `useAuth` hook: calls `ipcClient.auth.logout`, clears Zustand store, redirects to `/login` in `frontend/hooks/useAuth.ts`
- [X] T029 [US4] `Sidebar` component (RTL, right-aligned) with navigation links (`/dashboard`, `/settings`) and logout button in `frontend/components/layout/Sidebar.tsx`
- [X] T030 [P] [US4] `Topbar` component with user full name and avatar initials in `frontend/components/layout/Topbar.tsx`
- [X] T031 [US4] `AppLayout` wrapper rendering `Sidebar` + `Topbar` + `{children}` in `frontend/components/layout/AppLayout.tsx`
- [X] T032 [US4] Dashboard route group layout wraps children in `AuthGuard` then `AppLayout` in `frontend/app/(dashboard)/layout.tsx`

**Checkpoint**: User Story 4 complete — logout button visible in sidebar, session is invalidated on click, and protected routes deny re-entry.

---

## Phase 7: User Story 5 — Password Management (Priority: P3)

**Goal**: An authenticated user can navigate to settings, enter their current password and a new valid password, and have the change applied immediately.

**Independent Test**: Log in → go to settings → change password → log out → log in with new password → verify success. Attempt login with old password → verify failure.

### Implementation for User Story 5

- [X] T033 [P] [US5] Password update logic in `electron/main.js` `user:changePassword` handler (inline — no separate query file needed at runtime)
- [X] T034 [P] [US5] `user:changePassword` handler: Argon2id verify current → complexity check (8+ chars, upper, lower, digit) → hash new → UPDATE users → audit log
- [X] T035 [US5] `user:changePassword` IPC handler registered in `electron/main.js` via `registerIpcHandlers()`
- [X] T036 [US5] All handlers registered together in one `registerIpcHandlers()` call in `electron/main.js`
- [X] T037 [US5] `useUser` hook calling `ipcClient.user.changePassword` in `frontend/hooks/useUser.ts`
- [X] T038 [US5] Settings page with password change form (current, new, confirm fields) using react-hook-form + Zod + `useUser` in `frontend/app/(dashboard)/settings/page.tsx`

**Checkpoint**: User Story 5 complete — password change succeeds with valid input, is rejected if current password is wrong, and new password is enforced on next login.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story hardening, localization, and validation

- [X] T039 [P] Arabic localization keys populated in `frontend/public/locales/ar/auth.json` and `frontend/public/locales/ar/common.json`
- [X] T040 [P] `AUTH_SESSION_EXPIRED` push event handled in `AuthGuard` — clears store and redirects to `/login`
- [X] T041 Sidebar navigation includes link to `/settings` page in `frontend/components/layout/Sidebar.tsx`
- [ ] T042 Run `quickstart.md` validation: verify login with `admin`/`Admin123!`, sidebar RTL alignment, session persistence across restart, logout flow, and password change scenario

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on other stories
- **US2 (Phase 4)**: Depends on Phase 2 and US1 (uses AuthGuard with the store established in US1)
- **US3 (Phase 5)**: Depends on US1 + US2 (extends AuthGuard and the auth handler)
- **US4 (Phase 6)**: Depends on US1 + US2 (adds logout to the auth handler and wraps the dashboard layout)
- **US5 (Phase 7)**: Depends on US1 + US4 (requires authenticated session and AppLayout with settings link)
- **Polish (Phase 8)**: Depends on all story phases

### Within Each User Story

- Queries → Service → IPC handler → Hook → UI component → Page
- Models before services, services before IPC handlers, handlers before hooks, hooks before components

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (login screen + credentials)
4. Complete Phase 4: User Story 2 (route protection)
5. **STOP and VALIDATE**: Log in, confirm dashboard access, confirm direct URL blocked
6. Ship MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Login works → **MVP Demo**
3. US2 → Routes protected → **Security baseline**
4. US3 → Session persists → **UX improvement**
5. US4 → Logout works → **Full auth loop**
6. US5 → Password change → **Security management**
7. Polish → Production-ready

---

## Notes

- **No `localStorage`**: Session lives in SQLite via `better-sqlite3` in Electron main process
- **No business logic in components**: All auth/user logic is in `electron/main.js` IPC handlers
- **No Drizzle in renderer**: All database access goes through IPC. Drizzle TypeScript files in `electron/` are type-reference only (not loaded at runtime)
- **CommonJS entry**: `electron/main.js` is plain CommonJS — no TypeScript compilation step needed at runtime
- **Native modules**: `argon2` and `better-sqlite3` are rebuilt for Electron v41 ABI via `@electron/rebuild`; `postinstall` script handles this automatically
- **Static export**: Next.js is configured with `output: 'export'` + `trailingSlash: true` for Electron production bundling
- **RTL enforcement**: `dir="rtl"` is set on the root `<html>` in `frontend/app/layout.tsx`
