# Implementation Plan: Models, Pieces & Platform-Wide Relational Consistency

**Branch**: `009-models-parts-consistency` | **Date**: 2026-03-16 | **Spec**: [spec.md](./spec.md)

## Summary

Introduce three new managed lookup tables (`models`, `parts`, `sizes`) following the existing colors/types/units pattern. Restructure Cutting Step 2 to use part+size selects per row. Add context columns (`model_name`, `part_name`, `color`) to `cutting_pieces` and `employee_operations`; add `model_name` to `stock_transactions`. Replace all free-text model/size fields across forms with `ManagedDropdown` components backed by the new managed lists. Enhance employee operations history and stock transaction history to show full context with source-record navigation.

## Technical Context

**Language/Version**: TypeScript 5 strict (frontend renderer) + Node.js plain JavaScript (Electron main process)
**Primary Dependencies**: Next.js 14 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod, Tailwind CSS 4, Lucide React
**Storage**: SQLite via better-sqlite3 (plain JS prepared statements in `electron/main.js`); Drizzle ORM schemas in `electron/db/schema/` are reference-only (not executed at runtime)
**Testing**: Manual QA against quickstart.md scenarios
**Target Platform**: Electron 41 desktop app (macOS, offline-only, single-user)
**Project Type**: Desktop app (Electron + Next.js renderer)
**Performance Goals**: Inline-add completes in < 10 seconds; selectors reflect latest data at moment of open without page refresh
**Constraints**: All selector updates are within the same running session via IPC re-fetch (no cross-device sync); historical free-text records are not migrated
**Scale/Scope**: ~5 new/modified tables, ~15 IPC channels added/modified, ~12 frontend components new/modified

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Core Data Flow (Page → Hook → ipc-client → handler → service → queries) | ✅ PASS | All new features follow the chain |
| Component & Page Discipline (pages compose only, components ≤150 lines) | ✅ PASS | Existing pattern maintained |
| Type Safety (strict TS, no `any`, Zod validation) | ✅ PASS | All new IPC payloads validated with Zod |
| RTL & Localization First | ✅ PASS | All new strings in Arabic; `dir="rtl"` preserved |
| UI/UX Consistency (AppLayout, EmptyState, skeleton, ConfirmDialog) | ✅ PASS | Settings sections reuse `LookupSection` |
| NEVER raw SQL in renderer | ✅ PASS | All DB access stays in Electron main process |
| NEVER Drizzle in renderer | ✅ PASS | Drizzle schemas are reference-only |

**Note on Drizzle**: The constitution states "Queries: Drizzle ORM only" but the established project pattern (documented in CLAUDE.md for every feature since 003) uses plain better-sqlite3 prepared statements in `main.js`. Drizzle schemas serve as documentation. This feature continues the established pattern.

## Project Structure

### Documentation (this feature)

```text
specs/009-models-parts-consistency/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ipc-channels.md  ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
electron/
  db/schema/
    model.ts                         NEW — reference schema for models table
    part.ts                          NEW — reference schema for parts table
    size.ts                          NEW — reference schema for sizes table
    cutting_piece.ts                 UPDATE — add part_name, color columns
    employee_operation.ts            UPDATE — add model_name, part_name, color columns
    stock_transaction.ts             UPDATE — add model_name column

  features/
    lookups/
      queries.js                     UPDATE — add getModels, getParts, getSizes queries
      service.js                     UPDATE — add create/update/delete for models/parts/sizes

  main.js                            UPDATE — DB migrations (ALTER TABLE), new IPC handlers for
                                     models/parts/sizes, updated cutting:create, updated
                                     employees:addOperation, updated stock consumption inserts

  preload.js                         UPDATE — expose models/parts/sizes channels under lookups namespace

frontend/
  features/lookups/
    lookups.types.ts                 UPDATE — add ModelEntry, PartEntry, SizeEntry types

  components/cutting/
    PartSizeRowsEditor.tsx           NEW — replaces SizeRowsEditor; rows = part select + size select + qty
    CuttingStep1Form.tsx             UPDATE — model_name field → ManagedDropdown (models list)
    CuttingStep2Form.tsx             UPDATE — swap SizeRowsEditor for PartSizeRowsEditor

  components/distribution/
    (distribution form component)    UPDATE — model_name + size_label → ManagedDropdown

  components/employees/
    OperationsHistory.tsx            UPDATE — add model/part/color columns; make rows clickable for navigation

  components/stock/
    TransactionHistory.tsx           UPDATE — show model_name on consumed transactions

  components/settings/
    SettingsPage (or page.tsx)       UPDATE — add Models, Parts, Sizes sections using LookupSection

  hooks/
    useLookups.ts                    UPDATE — add models/parts/sizes data + CRUD methods

  lib/ipc-client.ts                  UPDATE — add typed wrappers for models/parts/sizes channels
```

**Structure Decision**: Single Electron + Next.js project, feature modules added to existing directories per domain.

## Complexity Tracking

No constitution violations requiring justification.
