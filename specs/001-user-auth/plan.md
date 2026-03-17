# Implementation Plan: User Authentication & App Shell

**Branch**: `001-user-auth` | **Date**: 2026-03-14 | **Spec**: [specs/001-user-auth/spec.md]
**Input**: Feature specification and App Shell requirements (Sidebar/Topbar layout).

## Summary
Implementation of a secure authentication system for a single-user desktop application and the global App Shell layout. Authentication includes a persistent login session, protected routes, and password management. The App Shell features a right-side Arabic sidebar with navigation and a topbar with user profile and search, following a global RTL layout.

## Technical Context

**Language/Version**: TypeScript 5.0, Next.js 14 (App Router)  
**Primary Dependencies**: Electron, shadcn/ui, Tailwind CSS, Zustand, react-hook-form, Zod, Drizzle ORM  
**Storage**: SQLite via Drizzle ORM  
**Testing**: [NEEDS CLARIFICATION: Testing framework for Electron/Next.js integration not specified]  
**Target Platform**: Desktop (macOS/Windows/Linux via Electron)
**Project Type**: Desktop Application  
**Performance Goals**: Login completion < 5s; 100% unauthenticated redirect to login.  
**Constraints**: Single user, global RTL (Arabic), persistent session across restarts, NO registration screen.  
**Scale/Scope**: Single-user local desktop environment.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Data Flow Architecture**: MUST use Page -> Hook -> IPC -> Service -> Query. Checked: All auth logic will reside in Services/Queries in Electron main process.
- **Component Discipline**: All UI components (Sidebar, Topbar) MUST be < 150 lines and use named exports.
- **RTL & Localization**: `dir="rtl"` MUST be enforced. All navigation labels and UI text MUST be in `public/locales/ar/`.
- **"NEVER" List**: No business logic in components. No Drizzle in renderer (Next.js). No `localStorage` for session (use SQLite).

## Project Structure

### Documentation (this feature)

```text
specs/001-user-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code Layout

```text
electron/
├── main/                # Auth logic initialization, window management
├── preload/             # Preload scripts for IPC
└── ipc/                 # auth.handler.ts, user.handler.ts

src/
├── app/                 
│   ├── (auth)/login/    # Login page
│   └── (dashboard)/     # Protected dashboard routes with AppLayout
├── components/          
│   ├── layout/          # AppLayout, Sidebar, Topbar
│   ├── ui/              # shadcn/ui components
│   └── auth/            # LoginForm
├── features/            
│   ├── auth/            # AuthService, auth.queries.ts, auth.types.ts
│   └── user/            # UserService, user.queries.ts
├── hooks/               # useAuth, useUser
├── db/
│   └── schema/          # user.ts, session.ts, audit_log.ts
├── lib/                 # ipc-client.ts
└── store/               # useAuthStore (UI state)

public/
└── locales/
    └── ar/              # common.json, auth.json
```

**Structure Decision**: The project uses Next.js Route Groups `(auth)` and `(dashboard)` to separate public and protected layouts. Authentication state is managed via Zustand in the renderer and validated via IPC handlers in the main process.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
