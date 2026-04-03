# atelier Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-03

## Active Technologies
- TypeScript 5 (frontend) + Node.js / plain JavaScript (Electron main process) + Next.js 16 (App Router, `output: export`), Electron 41, better-sqlite3, react-hook-form, Zod, Tailwind CSS (003-suppliers-purchases)
- SQLite via better-sqlite3 (plain JS in `electron/main.js` — Drizzle TypeScript schemas exist as reference but are not executed at runtime) (003-suppliers-purchases)
- TypeScript 5 (strict mode) — Electron main process + Next.js 14 App Router renderer + Electron, Next.js 14 (static export), Drizzle ORM (better-sqlite3), react-hook-form + Zod, shadcn/ui + Tailwind CSS, Zustand (004-employee-management)
- SQLite via Drizzle ORM — three new tables: `employees`, `employee_operations`, `employee_payments` (004-employee-management)
- TypeScript 5 (strict mode) — Next.js 14 renderer; plain JavaScript — Electron main process (`electron/main.js`) + Next.js 14 (App Router, static export), Electron 41, better-sqlite3, react-hook-form + Zod 4, Tailwind CSS 4, Lucide Reac (005-cutting-sessions)
- SQLite via better-sqlite3; 3 new tables (`cutting_sessions`, `cutting_pieces`, `cutting_consumption_entries`); 2 existing tables used (`stock_transactions`, `employee_operations`) (005-cutting-sessions)
- SQLite via better-sqlite3; 6 new tables (`tailors`, `tailor_payments`, `distribution_batches`, `distribution_piece_links`, `return_records`, `return_consumption_entries`); existing tables used: `cutting_pieces` (status updates), `stock_transactions` (consumption deductions) (006-piece-distribution)
- TypeScript 5 (strict) — frontend renderer; Node.js / plain JavaScript — Electron main process + Next.js 14 App Router (static export), Electron, better-sqlite3, react-hook-form + Zod, Tailwind CSS, Lucide Reac (007-stock-lookup-mgmt)
- SQLite via better-sqlite3 (plain JS in `electron/main.js`); Drizzle ORM schemas in `electron/db/schema/` are reference-only (not executed at runtime) (007-stock-lookup-mgmt)
- TypeScript 5 strict (frontend renderer) + Node.js plain JS (Electron main process) + Next.js 14 App Router, Electron, better-sqlite3, react-hook-form + Zod, Tailwind CSS, Lucide Reac (008-qc-finition)
- SQLite via better-sqlite3 (plain JS in electron/main.js); Drizzle ORM schemas in electron/db/schema/ are reference-only (008-qc-finition)
- TypeScript 5 strict (frontend renderer) + Node.js plain JavaScript (Electron main process) + Next.js 14 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod, Tailwind CSS 4, Lucide Reac (009-models-parts-consistency)
- SQLite via better-sqlite3 (plain JS prepared statements in `electron/main.js`); Drizzle ORM schemas in `electron/db/schema/` are reference-only (not executed at runtime) (009-models-parts-consistency)
- TypeScript 5 strict (frontend renderer) + Node.js plain JavaScript (Electron main process) + Next.js 14 App Router (static export), Electron 41, better-sqlite3, Tailwind CSS 4, Lucide Reac (010-final-stock-screen)
- SQLite via better-sqlite3; migrated `final_stock_entries` to add `part_name TEXT` (nullable) (010-final-stock-screen)
- TypeScript 5 strict (frontend) + Node.js plain JS (Electron main) + Next.js 14 App Router (static export), Electron 41, better-sqlite3, Recharts (NEW — must install), Tailwind CSS 4, Lucide Reac (011-analytics-dashboard)
- SQLite via better-sqlite3; no schema changes — reads from existing tables only (011-analytics-dashboard)
- TypeScript 5 strict (frontend) + Node.js plain JS (Electron main) + Next.js 14 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod, Tailwind CSS 4, Lucide React, Recharts (012-pieces-availability)
- SQLite via better-sqlite3; 2 schema changes: `part_name TEXT` on `distribution_batches`, new `app_settings` table (012-pieces-availability)
- TypeScript 5 strict (frontend renderer) + Node.js plain JavaScript (Electron main process) + Next.js 14 App Router, Electron 41, better-sqlite3, react-hook-form + Zod, shadcn/ui + Tailwind CSS 4, Lucide Reac (013-parts-distribution-fix)
- SQLite via better-sqlite3 prepared statements in `electron/main.js`; Drizzle ORM schemas in `electron/db/schema/` are reference-only (not executed at runtime) (013-parts-distribution-fix)
- TypeScript 5 (strict, frontend renderer) + Node.js plain JS (Electron main process) + Next.js 14 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod, Tailwind CSS 4, Lucide Reac (014-cutting-parts-size-color)
- SQLite via better-sqlite3 plain prepared statements in `electron/main.js`; Drizzle ORM schemas in `electron/db/schema/` are reference-only (014-cutting-parts-size-color)
- TypeScript 5 strict (frontend renderer) + Node.js plain JS (Electron main process) + Next.js 14 App Router, Electron 41, better-sqlite3, react-hook-form + Zod, Tailwind CSS 4, Lucide React, shadcn/ui (015-consumed-materials-flows)
- TypeScript 5 strict (frontend renderer) + Node.js plain JavaScript (Electron main process) + Next.js 16 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod 4, Tailwind CSS 4, Lucide React, shadcn/ui (018-session-cost-distribution)
- SQLite via better-sqlite3 plain prepared statements in `electron/main.js`; Drizzle ORM schemas in `electron/db/schema/` are reference-only (not executed at runtime) (018-session-cost-distribution)
- TypeScript 5 (strict, frontend renderer) + Node.js plain JavaScript (Electron main process) + Next.js 16 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod 4, Tailwind CSS 4, Lucide React, shadcn/ui (019-cutting-session-stepper)
- SQLite via better-sqlite3 plain prepared statements in `electron/main.js`; no new tables required (019-cutting-session-stepper)

- TypeScript 5 (strict mode) + Next.js 16 (App Router, static export), React 19, Electron 41, better-sqlite3 12, Drizzle ORM, Zod 4, react-hook-form 7, Zustand 5, Tailwind 4, Lucide Reac (002-stock-management)

## Project Structure

```text
electron/              # Main process: IPC handlers, services, queries, DB schemas
  db/schema/           # Drizzle table definitions
  features/[module]/   # service.ts + queries.ts per domain
  ipc/                 # [module].handler.ts per domain
  main/                # Electron entry point
  preload/             # IPC bridge exposed to renderer

frontend/              # Next.js renderer (static export for Electron)
  app/(dashboard)/     # Protected pages
  components/[module]/ # UI components per domain
  hooks/               # Data hooks (IPC calls + state)
  features/[module]/   # Shared types per domain
  lib/ipc-client.ts    # Typed IPC client wrapper
  store/               # Zustand stores (UI state only)
  public/locales/ar/   # All Arabic strings
```

## Commands

npm run dev:electron   # Start Electron + Next.js dev server
npm run build          # Build Next.js static export
npm run build:electron # Full Electron distribution build

## Code Style

TypeScript 5 (strict mode): Follow standard conventions

## Recent Changes
- 020-distribution-modal-cost: Added TypeScript 5 strict (frontend renderer) + Node.js plain JavaScript (Electron main process) + Next.js 16 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod 4, Tailwind CSS 4, Lucide Reac
- 019-cutting-session-stepper: Added TypeScript 5 (strict, frontend renderer) + Node.js plain JavaScript (Electron main process) + Next.js 16 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod 4, Tailwind CSS 4, Lucide React, shadcn/ui
- 018-session-cost-distribution: Added TypeScript 5 strict (frontend renderer) + Node.js plain JavaScript (Electron main process) + Next.js 16 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod 4, Tailwind CSS 4, Lucide React, shadcn/ui


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
