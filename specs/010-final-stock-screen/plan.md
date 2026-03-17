# Implementation Plan: Final Stock Screen

**Branch**: `010-final-stock-screen` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)

## Summary

Build a read-only Final Stock screen accessible from the sidebar. The screen displays three KPI cards (total pieces, distinct models, distinct size+color combos), a filterable table grouped by model+part+size+color, and a click-through history panel showing individual addition events with navigation to source finition records.

**Critical discovery**: The existing `final_stock_entries` table (from Feature 008) was missing the `part_name` column required by the spec. A nullable `part_name TEXT` column was added via idempotent migration.

## Technical Context

**Language/Version**: TypeScript 5 strict (frontend renderer) + Node.js plain JavaScript (Electron main process)
**Primary Dependencies**: Next.js 14 App Router (static export), Electron 41, better-sqlite3, Tailwind CSS 4, Lucide React
**Storage**: SQLite via better-sqlite3; migrated `final_stock_entries` to add `part_name TEXT` (nullable)
**Testing**: Manual QA — see `quickstart.md` (8 scenarios)
**Target Platform**: Electron desktop app
**Project Type**: Desktop app — new read-only feature screen
**Performance Goals**: Sub-2s screen load on 500+ entries
**Constraints**: Screen is 100% read-only; all writes come from finition flow; no add/edit controls
**Scale/Scope**: 3 new IPC channels, 1 page, 1 hook, 3 components, 2 service files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Page → Hook → ipc-client → IPC handler → service → queries → SQLite
- ✅ Page: layout composition + hook call only (no business logic)
- ✅ Components: max 150 lines, named exports, no business logic
- ✅ Hook: IPC calls + state management, no JSX
- ✅ No business logic in components
- ✅ No useEffect for data fetching (initial load via useEffect in hook calls fetchAll; filters via callback — correct pattern)
- ✅ All loading/empty/error states handled
- ✅ No forms → Zod validation not applicable

## Project Structure

### Documentation (this feature)

```text
specs/010-final-stock-screen/
├── plan.md              # This file
├── research.md          # Phase 0 — query decisions, migration strategy
├── data-model.md        # Phase 1 — entities and derived types
├── contracts/
│   └── ipc-channels.md  # Phase 1 — 3 new + 1 updated IPC channels
└── quickstart.md        # Phase 1 — 8 manual QA scenarios
```

### Source Code

```text
electron/main.js                                   # MODIFIED
  - Migration: ALTER TABLE final_stock_entries ADD COLUMN part_name TEXT
  - require: finalStockService
  - 3 new handlers: final-stock:getKpis, final-stock:getRows, final-stock:getHistory

electron/features/final-stock/                     # NEW
  queries.js                                       # getKpis, getRows, getHistory SQL queries
  service.js                                       # thin wrapper

electron/features/finition/service.js              # MODIFIED
  - addToFinalStock accepts optional partName
  - INSERT now includes part_name column

electron/preload.js                                # MODIFIED
  - Added finalStock: { getKpis, getRows, getHistory }

frontend/features/final-stock/final-stock.types.ts  # NEW
frontend/features/finition/finition.types.ts        # MODIFIED — partName? on AddToFinalStockPayload
frontend/features/auth/auth.types.ts                # MODIFIED — Window.ipcBridge.finalStock declaration

frontend/lib/ipc-client.ts                         # MODIFIED — finalStock section + import
frontend/hooks/useFinalStockList.ts                # NEW
frontend/components/final-stock/
  FinalStockKpiCards.tsx                           # NEW
  FinalStockTable.tsx                              # NEW
  FinalStockHistoryPanel.tsx                       # NEW
frontend/app/(dashboard)/final-stock/page.tsx      # NEW
frontend/components/layout/Sidebar.tsx             # MODIFIED — PackageCheck icon + nav item
```

**Structure Decision**: Single project (Option 1). All changes contained within existing electron/ and frontend/ directories following established domain feature pattern.
