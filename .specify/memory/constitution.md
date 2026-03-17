<!--
Sync Impact Report:
- Version change: N/A → 1.0.0
- List of modified principles (old title → new title if renamed):
  - [PRINCIPLE_1_NAME] → Core Data Flow Architecture
  - [PRINCIPLE_2_NAME] → Component & Page Discipline
  - [PRINCIPLE_3_NAME] → Type Safety & Data Integrity
  - [PRINCIPLE_4_NAME] → RTL & Localization First
  - [PRINCIPLE_5_NAME] → UI/UX Consistency & State Management
- Added sections: Development Prohibitions (The "NEVER" list), Technology Stack & Structure
- Removed sections: N/A
- Templates requiring updates (✅ updated / ⚠ pending):
  - .specify/templates/plan-template.md (⚠ pending)
  - .specify/templates/spec-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: 
  - Update plan-template.md to reflect specific Electron/Next.js architecture.
-->

# Atelier Constitution

## Core Principles

### Core Data Flow Architecture (NON-NEGOTIABLE)
All data operations MUST follow this exact sequence without skipping steps:
1. **Page**: Composes layout and calls hooks.
2. **Hook**: Manages IPC calls and loading/error/data states.
3. **ipc-client**: Standardized client for Electron communication.
4. **electron/ipc handler**: Backend entry point in the main process.
5. **service**: Contains pure business logic.
6. **queries**: Direct database interactions using Drizzle ORM.
7. **Drizzle**: ORM layer.
8. **SQLite**: Persistent database layer.

### Component & Page Discipline
- **Pages**: Compose UI and call hooks only. NO logic, NO database access.
- **Components**: Render UI and emit events only. Max 150 lines. MUST use named exports. NO inline styles.
- **Hooks**: Handle IPC calls and state management (loading/error/data). NO JSX.
- **Services**: Pure business logic only. NO JSX, NO hooks.
- **Queries**: Drizzle ORM only. NO raw SQL, NO logic.
- **IPC Handlers**: Call services only. One file per domain.
- **Schemas**: Table definitions only. Every table MUST have `id`, `created_at`, and `updated_at`.

### Type Safety & Data Integrity
- **TypeScript**: Strict mode ALWAYS. NO `any`, NO `@ts-ignore`.
- **IPC**: All channels defined as `const enum`. Responses typed as `{success:true,data:T}|{success:false,error:string}`.
- **Validation**: All form data MUST be Zod-validated before reaching the service layer.

### RTL & Localization First
- **UI**: Global Arabic UI with `dir="rtl"` enforced on the root layout.
- **Strings**: ALL strings MUST be externalized to `public/locales/ar/`. NO hardcoded strings in JSX.

### UI/UX Consistency & State Management
- **Standard Layout**: Every page MUST have `AppLayout` and `PageHeader`.
- **Empty States**: Every list MUST have an `EmptyState`.
- **Async Operations**: MUST have skeleton loaders, disabled buttons, and spinners.
- **Error Handling**: Show errors via `ErrorAlert`, NEVER swallow errors.
- **User Confirmation**: All destructive actions MUST require a `ConfirmDialog`.
- **Forms**: Use `react-hook-form` + Zod resolver + visible labels + error slots + toast on success.
- **State**: DB data via hooks. UI state via Zustand. Form state via `react-hook-form`. Use `useSearchParams` for filters/pagination. NO Zustand for single-component data.

## Development Prohibitions (The "NEVER" List)
- NEVER place business logic in components.
- NEVER use Drizzle in the renderer process.
- NEVER use `localStorage` for persistent data (use SQLite).
- NEVER use prop drilling beyond 3 levels.
- NEVER use `useEffect` for data fetching.
- NEVER include hardcoded strings in JSX.
- NEVER skip loading/empty/error states.
- NEVER create forms without Zod validation.

## Technology Stack & Structure

### Core Stack
- Next.js 14 (App Router)
- Electron
- shadcn/ui + Tailwind (RTL)
- SQLite via Drizzle ORM
- Zustand + react-hook-form + Zod
- Recharts

### Directory Structure
- `electron/`: Main process, preload, and IPC handlers.
- `src/app/`: Next.js pages only.
- `src/components/`: UI components (ui/, shared/, per-module).
- `src/features/[module]/`: Feature-specific services, queries, and types.
- `src/hooks/`: Data fetching and IPC integration.
- `src/db/schema/`: Drizzle table definitions.
- `src/lib/ipc-client.ts`: Typed IPC client.
- `src/store/`: Zustand stores for UI state.

## Governance
This Constitution supersedes all other documentation and practices within the project. All architectural decisions must be justified against these principles. Amendments to this document require a formal proposal and consensus.

**Version**: 1.0.0 | **Ratified**: 2026-03-14 | **Last Amended**: 2026-03-14
