# Research: User Authentication & App Shell

## Decision: Testing Framework
- **Decision**: Playwright for End-to-End (E2E) and Vitest for Unit/Integration.
- **Rationale**: Playwright has excellent support for Electron. Vitest is fast and integrates well with the Next.js/Vite ecosystem for non-browser logic.
- **Alternatives considered**: Cypress (limited Electron support), Jest (slower, more configuration needed for ESM).

## Decision: Password Hashing
- **Decision**: Use `argon2` library in the Electron main process.
- **Rationale**: Argon2id is the industry standard (as clarified in spec). Electron main process has full Node.js access for native modules.
- **Alternatives considered**: `bcrypt` (also secure but Argon2id is preferred).

## Decision: Session Persistence
- **Decision**: Store a signed session token in SQLite; keep the active session in a `session` table. Renderer process receives the token via IPC and stores it in a secure Cookie (managed by Electron's `session` module) or simply relies on IPC for every check.
- **Rationale**: The Constitution prohibits `localStorage`. Using SQLite ensures persistence across restarts. Electron's `session` module can manage cookie-like behavior for HTTP, but since we are local, an IPC-based check on app boot is most reliable.
- **Alternatives considered**: `node-keytar` (good for secrets, but SQLite is already in the stack).

## Decision: App Shell Layout (RTL)
- **Decision**: Use Next.js Route Groups and a global Layout component that sets `dir="rtl"` and `lang="ar"`. Sidebar will be a persistent client component using Zustand for "active" state.
- **Rationale**: Simplifies route protection by applying a specific layout to all pages under `(dashboard)`.
- **Alternatives considered**: Individual page layouts (redundant).

## Decision: Data Flow (Auth)
- **Decision**: 
    1. Middleware (Next.js) or a Top-level Guard component checks auth status via IPC.
    2. If unauthenticated, redirect to `/login`.
    3. `LoginForm` calls `useAuth` hook -> `ipcClient.auth.login` -> `auth.handler` -> `AuthService` (Argon2 check) -> `auth.queries` (SQLite).
- **Rationale**: Follows Constitution's mandatory data flow.
