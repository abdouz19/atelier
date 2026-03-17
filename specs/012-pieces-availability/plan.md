# Implementation Plan: Distribution & Dashboard Pieces Availability Enhancement

**Branch**: `012-pieces-availability` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)

## Summary

Enhance the distribution flow and dashboard with pieces inventory awareness. The Distribute modal gains a grouped availability table (part+size+color combinations with not-distributed counts) replacing the separate dropdowns. A new Pieces Availability tab within the Distribution screen shows a full production breakdown with red/amber flagging and a re-cut shortcut. The Dashboard adds two new KPI cards, a top-10 critical combinations widget, and a second data series (distributed per month) on the production bar chart. Requires 2 schema changes, 4 new IPC channels, and modifications to the existing distribute handler, dashboard service, and several frontend components.

## Technical Context

**Language/Version**: TypeScript 5 strict (frontend) + Node.js plain JS (Electron main)
**Primary Dependencies**: Next.js 14 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod, Tailwind CSS 4, Lucide React, Recharts
**Storage**: SQLite via better-sqlite3; 2 schema changes: `part_name TEXT` on `distribution_batches`, new `app_settings` table
**Testing**: Manual QA against quickstart scenarios
**Target Platform**: Electron desktop app
**Project Type**: Desktop app — enhance 3 existing screens + extend backend service
**Performance Goals**: Availability table loads within 2s after model selection; Pieces Availability screen loads within 3s
**Constraints**: Pieces Availability screen is read-only; no new tables except app_settings; part_name on existing distribution_batches is nullable (backward compatible)
**Scale/Scope**: 2 schema changes, 4 new IPC channels, 2 modified IPC channels, 2 modified components, 1 new screen (tab), ~5 new components, 2 modified hooks

## Constitution Check

- ✅ Page → Hook → ipc-client → IPC handler → service → queries → SQLite
- ✅ Page: layout + hook only
- ✅ Components: named exports, max 150 lines, no business logic
- ✅ Hook: IPC + state, no JSX
- ✅ All loading/empty/error states required
- ✅ Forms (quantity + sewing price in DistributeModal): react-hook-form + Zod, already in place
- ✅ useSearchParams for tab state in Distribution screen
- ✅ SQLite for persistent settings (NEVER localStorage — app_settings table)
- ⚠️ Inline Arabic strings: existing project convention (inline strings) used throughout; following project practice

## Project Structure

### Documentation (this feature)

```text
specs/012-pieces-availability/
├── plan.md              # This file
├── research.md          # Phase 0 findings
├── data-model.md        # Derived entities and query shapes
├── contracts/
│   └── ipc-channels.md  # IPC channel contracts
└── quickstart.md        # Manual QA scenarios
```

### Source Code

```text
electron/main.js                                    # MODIFY
  - Migration: ALTER TABLE distribution_batches ADD COLUMN part_name TEXT
  - Migration: CREATE TABLE IF NOT EXISTS app_settings (key, value, updated_at)
  - require: piecesService
  - 4 new handlers: distribution:getAvailabilityForModel, pieces:getAvailability,
                    pieces:getLowStockThreshold, pieces:setLowStockThreshold
  - MODIFY handler: distribution:distribute — insert part_name into distribution_batches

electron/features/pieces/                           # NEW
  queries.js                                        # SQL for availability breakdown and dashboard additions
  service.js                                        # Thin wrapper + settings read/write

electron/features/dashboard/queries.js              # MODIFY — add monthly distributed series + snapshot KPI additions
electron/features/dashboard/service.js             # MODIFY — getSnapshotData includes new KPI fields + widget

electron/preload.js                                 # MODIFY — add pieces namespace + distribution:getAvailabilityForModel

frontend/features/distribution/distribution.types.ts  # MODIFY — add partName? to DistributePayload; add AvailabilityCombination type
frontend/features/pieces/pieces.types.ts           # NEW — PiecesAvailabilityRow, LowStockThreshold
frontend/features/dashboard/dashboard.types.ts     # MODIFY — add new snapshot KPI fields, widget type, monthlyDistributed to chart data
frontend/features/auth/auth.types.ts               # MODIFY — add pieces namespace to Window.ipcBridge

frontend/lib/ipc-client.ts                         # MODIFY — add pieces section; add distribution:getAvailabilityForModel; update distribute payload

frontend/hooks/useDistributeForm.ts                # MODIFY — add selectedCombination state; fetch availability table; replace getAvailablePieces with table selection
frontend/hooks/usePiecesAvailability.ts            # NEW — fetch availability rows + threshold; filter state; re-cut trigger
frontend/hooks/useDashboard.ts                     # MODIFY — no IPC change needed; dashboard types change handles the new fields

frontend/components/distribution/DistributeModal.tsx        # MODIFY — replace size/color dropdowns with AvailabilityTableSelector
frontend/components/distribution/AvailabilityTableSelector.tsx  # NEW — grouped combination table inside modal
frontend/components/distribution/PiecesAvailabilityTab.tsx  # NEW — full availability screen (tab content)
frontend/components/distribution/PiecesAvailabilityTable.tsx # NEW — sortable/filterable availability table
frontend/components/dashboard/DashboardKpiCards.tsx         # MODIFY — add 2 new KPI cards
frontend/components/dashboard/PiecesAvailabilityWidget.tsx  # NEW — top-10 critical widget
frontend/components/dashboard/MonthlyProductionChart.tsx    # MODIFY — add second series (distributed)

frontend/app/(dashboard)/distribution/page.tsx     # MODIFY — add tab switcher (التوزيع | توافر القطع)
frontend/app/(dashboard)/dashboard/page.tsx        # MODIFY — add PiecesAvailabilityWidget
```

---

## Phase 0 Research

### Decision: Availability Query — use cutting_sessions JOIN

- **Finding**: `cutting_pieces` has no `model_name` column — model comes from `cutting_sessions.model_name`. Color comes from `cutting_sessions.fabric_color` (consistent with existing `getAvailablePieces` handler). The `part_name` and `size_label` columns exist on `cutting_pieces` (via ALTER TABLE from Feature 009).
- **Query**: GROUP BY (cs.model_name, cp.part_name, cp.size_label, cs.fabric_color) with SUM(CASE WHEN status='not_distributed' THEN 1 ELSE 0 END) pattern.

### Decision: Schema Changes

1. **`distribution_batches.part_name TEXT`** — nullable ALTER TABLE; enables part tracking for future distributions
2. **`app_settings` table** — key-value store for persistent settings (NEVER localStorage per constitution)
   - `key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL`
   - Low-stock threshold stored as key=`'low_stock_threshold'`, value=`'5'` (default)

### Decision: IPC Channels

| Channel | Change | Payload | Response |
|---------|--------|---------|----------|
| `distribution:getAvailabilityForModel` | NEW | `{ modelName: string }` | `AvailabilityCombination[]` |
| `pieces:getAvailability` | NEW | `{ modelName?: string, partName?: string, sizeLabel?: string, color?: string }` | `PiecesAvailabilityRow[]` |
| `pieces:getLowStockThreshold` | NEW | none | `{ threshold: number }` |
| `pieces:setLowStockThreshold` | NEW | `{ threshold: number }` | `void` |
| `distribution:distribute` | MODIFIED | adds `partName?: string \| null` | unchanged |
| `dashboard:getSnapshotData` | MODIFIED | none | adds `zeroStockCombosCount`, `lowStockCombosCount`, `criticalCombinations[]` |
| `dashboard:getChartData` | MODIFIED | unchanged | adds `monthlyDistributed: MonthlyDistributedPoint[]` |

### Decision: QC/Finition/FinalStock columns omitted from Pieces Availability

- **Decision**: Omit the in-QC, in-finition, and in-final-stock columns from the Pieces Availability screen
- **Rationale**: These quantities are tracked at the batch level (quantity numbers in return_records → qc_records → finition_records → final_stock_entries), not at individual cutting_piece level. Attributing them to a specific (model, part, size, color) would require joining all those tables with complex SUM logic, and would still be approximate for historical data (before `part_name` was added to distribution_batches). The primary value of the screen is the `not_distributed` count, which is exact. The screen shows: total produced, not distributed, in distribution, returned — all exactly computable from `cutting_pieces`.

### Decision: Monthly Distributed Series

- **Source**: `distribution_batches.distribution_date` (already indexed) + `SUM(quantity)` grouped by month
- **Filter**: same `modelName` filter as existing production chart; same 12-month window
- **Client merge**: `monthlyProduction` and `monthlyDistributed` share the 12-month month keys; client fills gaps with 0 for both

### Decision: Distribution screen tab switcher

- **URL param**: `?tab=availability` (default = distribution tab)
- **Pattern**: `useSearchParams` + `router.replace()` — same pattern used across all existing pages

---

## Phase 1 Design

### TypeScript Types

**`distribution.types.ts` additions**:
```typescript
export interface AvailabilityCombination {
  partName: string | null;
  sizeLabel: string;
  color: string;
  notDistributedCount: number;
}
// DistributePayload gains:
partName?: string | null;
```

**`pieces.types.ts`** (NEW):
```typescript
export interface PiecesAvailabilityRow {
  modelName: string;
  partName: string | null;
  sizeLabel: string;
  color: string;
  totalProduced: number;
  notDistributed: number;
  inDistribution: number;
  returned: number;
}

export interface CriticalCombination {
  modelName: string;
  partName: string | null;
  sizeLabel: string;
  color: string;
  notDistributed: number;
}
```

**`dashboard.types.ts` additions**:
```typescript
// In DashboardSnapshotKpis:
zeroStockCombosCount: number;
lowStockCombosCount: number;

// New in DashboardSnapshotData:
criticalCombinations: CriticalCombination[];  // top 10

// New in DashboardChartData:
monthlyDistributed: Array<{ month: string; distributed: number }>;
```

### Hook: usePiecesAvailability

```typescript
export function usePiecesAvailability() {
  // useSearchParams for model/part/size/color filters
  // On mount: fetch rows + threshold in parallel
  // threshold: local state, updated on inline change → calls setLowStockThreshold
  // rowClassification: 'zero' | 'low' | 'ok' per row (client-side, no re-fetch)
  // onRecut: (row) → router.push('/cutting?prefill=...')
  return { rows, loading, error, filters, setFilters, threshold, setThreshold, ... }
}
```

### Component: AvailabilityTableSelector

Inside the DistributeModal, shown after model is selected:
- Columns: قطعة (part), المقاس (size), اللون (color), المتاح (count)
- Disabled rows: zero-count, `opacity-50 cursor-not-allowed`
- Selected row: highlighted ring/border
- Max 150 lines

### Component: PiecesAvailabilityTable

Inside the Pieces Availability tab:
- 4 filter dropdowns (model, part, size, color) + threshold numeric input
- Table: 8 columns (model, part, size, color, produced, not-distributed, in-distribution, returned)
- Row colors: red bg for zero, amber bg for low
- "قطع مرة أخرى" button on flagged rows only

### Component: PiecesAvailabilityWidget

Dashboard widget:
- Compact table, top 10 rows sorted ascending by not-distributed
- Columns: model, part, size, color, not-distributed
- Row click → router.push('/distribution?tab=availability')

### MonthlyProductionChart update

Add second `<Bar>` with dataKey `distributed` and distinct fill color, plus `Legend` component.
