# Implementation Plan: Analytics Dashboard

**Branch**: `011-analytics-dashboard` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)

## Summary

Replace the stub dashboard page with a fully-featured analytics screen: 10 KPI cards, a 6-stage production pipeline widget, 6 Recharts charts, and a 20-entry activity feed. Date-range and model filters scope period-based KPIs and charts. All data is read-only, computed live from existing tables. Requires installing Recharts and adding 4 new IPC channels.

## Technical Context

**Language/Version**: TypeScript 5 strict (frontend) + Node.js plain JS (Electron main)
**Primary Dependencies**: Next.js 14 App Router (static export), Electron 41, better-sqlite3, Recharts (NEW — must install), Tailwind CSS 4, Lucide React
**Storage**: SQLite via better-sqlite3; no schema changes — reads from existing tables only
**Testing**: Manual QA against quickstart scenarios
**Target Platform**: Electron desktop app
**Project Type**: Desktop app — replace stub page with full analytics screen
**Performance Goals**: KPIs + pipeline within 3s; filter updates within 2s
**Constraints**: 100% read-only; no new tables; all data sourced from existing production tables
**Scale/Scope**: 4 new IPC channels, 1 hook, ~6 components, 1 page rewrite

## Constitution Check

- ✅ Page → Hook → ipc-client → IPC handler → service → queries → SQLite
- ✅ Page: layout + hook only
- ✅ Components: named exports, max 150 lines, no business logic
- ✅ Hook: IPC + state, no JSX
- ✅ Recharts is in the constitution-approved tech stack
- ✅ useSearchParams for date range + model filters (per constitution: "filters/pagination")
- ✅ All loading/empty/error states required
- ✅ No forms → Zod N/A
- ⚠️ Constitution says "ALL strings MUST be externalized to public/locales/ar/" but the entire project uses inline Arabic strings in practice (see all existing components). Following existing project convention (inline strings) to avoid rework.

## Project Structure

### Documentation (this feature)

```text
specs/011-analytics-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 findings
├── data-model.md        # Derived entities and query shapes
├── contracts/
│   └── ipc-channels.md  # 4 new IPC channel contracts
└── quickstart.md        # Manual QA scenarios
```

### Source Code

```text
frontend/package.json                          # MODIFY — add recharts dependency

electron/main.js                               # MODIFY — require dashboardService + 4 new handlers
electron/features/dashboard/                   # NEW
  queries.js                                   # All SQL for KPIs, pipeline, charts, activity feed
  service.js                                   # Thin wrapper

electron/preload.js                            # MODIFY — add dashboard namespace

frontend/features/dashboard/                   # NEW
  dashboard.types.ts                           # All TypeScript interfaces
frontend/features/auth/auth.types.ts           # MODIFY — add dashboard to Window.ipcBridge

frontend/lib/ipc-client.ts                     # MODIFY — add dashboard section

frontend/hooks/useDashboard.ts                 # NEW — all dashboard state + IPC

frontend/components/dashboard/                 # NEW
  DashboardKpiCards.tsx                        # 10 KPI cards grid
  PipelineWidget.tsx                           # 6-stage pipeline
  MonthlyProductionChart.tsx                   # Bar chart (Recharts)
  PipelineDonutChart.tsx                       # Donut chart (Recharts)
  TopTailorsChart.tsx                          # Horizontal bar (Recharts)
  TopModelsChart.tsx                           # Horizontal bar (Recharts)
  FabricConsumptionChart.tsx                   # Line chart (Recharts)
  EmployeeDebtChart.tsx                        # Bar chart (Recharts)
  ActivityFeed.tsx                             # 20-entry chronological list

frontend/app/(dashboard)/dashboard/page.tsx    # MODIFY — replace stub with full page
```

**Structure Decision**: Single project. All changes in existing electron/ and frontend/ directories following established domain feature pattern.

---

## Phase 0 Research

### Decision: Chart Library
- **Decision**: Recharts (confirmed from constitution Core Stack — `Recharts` is listed)
- **Finding**: Recharts is NOT currently installed in frontend/package.json — must `npm install recharts` before use
- **Key components needed**: `BarChart`, `Bar`, `LineChart`, `Line`, `PieChart`, `Pie`, `Cell`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `Legend`

### Decision: Filter State Management
- **Decision**: `useSearchParams` + `router.replace()` — confirmed pattern used by every existing page (stock, cutting, employees, distribution, etc.)
- **URL params**: `from` (timestamp ms), `to` (timestamp ms), `model` (model name string)
- **Default values**: computed in page from current calendar month if params absent

### Decision: IPC Channel Batching
- **Decision**: 4 channels with clear filter boundaries:
  1. `dashboard:getSnapshotData` — snapshot KPIs + pipeline stages + activity feed (never filter-dependent; always live state)
  2. `dashboard:getPeriodKpis({ startDate, endDate })` — period KPIs (purchases, employee debt)
  3. `dashboard:getChartData({ startDate, endDate, modelName? })` — all 6 chart datasets in one call
  4. *(Activity feed is included in getSnapshotData)*
- **Rationale**: Separating snapshot from period data allows targeted re-fetch — when filters change, only `getPeriodKpis` and `getChartData` are re-fetched; snapshot data stays stale-free without re-fetch

### Decision: Fabric Item Identification
- **Decision**: Fabric items are `stock_items` where `unit = 'متر'` (meters) — consistent with how the cutting:getFabrics handler identifies fabric items
- **Available meters per fabric**: `SUM(CASE WHEN st.type='inbound' THEN st.quantity ELSE -st.quantity END)` from stock_transactions per fabric item, optionally grouped by color
- **Simplified for dashboard**: Show one card per fabric item with total available meters across all colors

### Decision: Pipeline Stage Queries
| Stage | Label | Query Source |
|-------|-------|-------------|
| 1 | غير موزعة | `COUNT(*) FROM cutting_pieces WHERE status='not_distributed'` |
| 2 | في التوزيع | `COUNT(*) FROM cutting_pieces WHERE status='distributed'` (or via distribution_piece_links not yet returned) |
| 3 | مُعادة — بانتظار المراقبة | `pendingQc` = `SUM(rr.quantity_returned) - SUM(qr.quantity_reviewed)` |
| 4 | في مراقبة الجودة | `finitionPending` = QC-reviewed pieces awaiting finition |
| 5 | في التشطيب | `SUM(fr.quantity) FROM finition_records fr WHERE fr.is_ready=0` |
| 6 | مخزون نهائي | `SUM(fse.quantity) FROM final_stock_entries fse` |

Stages 1–2 count cutting_pieces rows (each row = one piece). Stages 3–6 count aggregate quantities from their respective tables.

### Decision: Activity Feed UNION Query
```sql
SELECT 'cutting_session' AS type, cs.id, cs.model_name, cs.session_date AS event_date
FROM cutting_sessions cs
UNION ALL
SELECT 'distribution' AS type, db.id, db.model_name, db.distribution_date
FROM distribution_batches db
UNION ALL
SELECT 'return' AS type, rr.id, db.model_name, rr.return_date
FROM return_records rr JOIN distribution_batches db ON db.id = rr.batch_id
UNION ALL
SELECT 'qc' AS type, qr.id, db.model_name, qr.review_date
FROM qc_records qr
  JOIN return_records rr ON rr.id = qr.return_id
  JOIN distribution_batches db ON db.id = rr.batch_id
UNION ALL
SELECT 'finition' AS type, fr.id, db.model_name, fr.finition_date
FROM finition_records fr
  JOIN qc_records qr ON qr.id = fr.qc_id
  JOIN return_records rr ON rr.id = qr.return_id
  JOIN distribution_batches db ON db.id = rr.batch_id
UNION ALL
SELECT 'final_stock' AS type, fse.id, fse.model_name, fse.entry_date
FROM final_stock_entries fse
ORDER BY event_date DESC LIMIT 20
```

### Decision: Employee Debt Calculation
```sql
SELECT e.id, e.name,
  COALESCE(SUM(eo.total_amount), 0) - COALESCE(SUM(ep.amount), 0) AS balance
FROM employees e
LEFT JOIN employee_operations eo ON eo.employee_id = e.id
LEFT JOIN employee_payments ep ON ep.employee_id = e.id
GROUP BY e.id, e.name
HAVING balance > 0
ORDER BY balance DESC
```

### Decision: Purchases KPI
```sql
SELECT COALESCE(SUM(st.total_price_paid), 0) AS total_purchases
FROM stock_transactions st
WHERE st.type = 'inbound'
  AND st.total_price_paid IS NOT NULL
  AND st.transaction_date >= ?  -- startDate
  AND st.transaction_date <= ?  -- endDate
```

---

## Phase 1 Design

### TypeScript Types (dashboard.types.ts)

```typescript
export interface DashboardSnapshotKpis {
  fabricItems: Array<{ name: string; availableMeters: number }>;
  zeroStockNonFabricCount: number;
  piecesNotDistributed: number;
  piecesInDistribution: number;
  piecesAwaitingQc: number;
  piecesAwaitingFinition: number;
  piecesInFinition: number;
  piecesInFinalStock: number;
  activeTailorsWithPendingDistributions: number;
}

export interface DashboardPeriodKpis {
  totalEmployeeDebt: number;     // sum of positive balances only
  totalPurchases: number;
}

export interface PipelineStage {
  label: string;
  count: number;
  href: string;                  // navigation target
}

export interface MonthlyProductionPoint { month: string; pieces: number }
export interface TopTailorPoint { name: string; returned: number }
export interface TopModelPoint { modelName: string; pieces: number }
export interface FabricConsumptionPoint { month: string; [fabricName: string]: number | string }
export interface EmployeeDebtPoint { name: string; balance: number }

export interface DashboardChartData {
  monthlyProduction: MonthlyProductionPoint[];
  topTailors: TopTailorPoint[];
  topModels: TopModelPoint[];
  fabricConsumption: FabricConsumptionPoint[];
  employeeDebt: EmployeeDebtPoint[];
}

export interface ActivityEntry {
  id: string;
  type: 'cutting_session' | 'distribution' | 'return' | 'qc' | 'finition' | 'final_stock';
  modelName: string | null;
  eventDate: number;
}

export interface DashboardFilters {
  startDate: number;
  endDate: number;
  modelName: string;
}
```

### IPC Channels

| Channel | Payload | Response |
|---------|---------|----------|
| `dashboard:getSnapshotData` | none | `{ kpis: DashboardSnapshotKpis, pipeline: PipelineStage[], activity: ActivityEntry[] }` |
| `dashboard:getPeriodKpis` | `{ startDate: number, endDate: number }` | `DashboardPeriodKpis` |
| `dashboard:getChartData` | `{ startDate: number, endDate: number, modelName?: string }` | `DashboardChartData` |

All wrapped in `{ success: true, data: T } | { success: false, error: string }`.

Pipeline donut chart data is derived client-side from the pipeline stages (no separate channel needed).

### Hook: useDashboard.ts

```typescript
export function useDashboard() {
  // URL-based filters via useSearchParams
  // On mount: fetch all 3 channels in parallel
  // On filter change: re-fetch getPeriodKpis + getChartData only
  // Returns: snapshotKpis, periodKpis, pipeline, chartData, activity, loading, error, filters, setFilters
}
```

### Page: dashboard/page.tsx

```tsx
'use client' — Suspense wrapper
// DashboardPageContent:
//   - Date range picker (two date inputs or simple month/year selects)
//   - Model filter dropdown (from useLookups().models)
//   - DashboardKpiCards (snapshot + period KPIs)
//   - PipelineWidget
//   - Grid of 6 chart components
//   - ActivityFeed
```

---

## Spec Artifacts to Generate

### research.md — Phase 0 decisions (this document above)
### data-model.md — Derived types and query shapes
### contracts/ipc-channels.md — 3 channel contracts
### quickstart.md — 6 manual QA scenarios
