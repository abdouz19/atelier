# Data Model: Analytics Dashboard

**Feature**: 011-analytics-dashboard | **Date**: 2026-03-17

All entities are derived — computed on demand from existing production tables. No new tables are created.

---

## Derived Entities

### DashboardSnapshotKpis

Computed from live database state. Not scoped by date range filter.

| Field | Type | Source |
|-------|------|--------|
| fabricItems | `Array<{ name: string; availableMeters: number }>` | `stock_items` WHERE `unit='متر'` + `stock_transactions` SUM |
| zeroStockNonFabricCount | `number` | `stock_items` WHERE `unit != 'متر'` AND available qty = 0 |
| piecesNotDistributed | `number` | `cutting_pieces` WHERE `status='not_distributed'` |
| piecesInDistribution | `number` | `cutting_pieces` WHERE `status='distributed'` |
| piecesAwaitingQc | `number` | `SUM(return_records.quantity_returned) - SUM(qc_records.quantity_reviewed)` |
| piecesAwaitingFinition | `number` | `SUM(qc_records.qty_acceptable+qty_good+qty_very_good) - SUM(finition_records.quantity)` |
| piecesInFinition | `number` | `SUM(finition_records.quantity WHERE is_ready=0)` |
| piecesInFinalStock | `number` | `SUM(final_stock_entries.quantity)` |
| activeTailorsWithPendingDistributions | `number` | `COUNT(DISTINCT tailor_id) FROM distribution_batches` WHERE unreturned pieces exist |

### DashboardPeriodKpis

Scoped by date range filter (`startDate`, `endDate`).

| Field | Type | Source |
|-------|------|--------|
| totalEmployeeDebt | `number` | `employees` JOIN `employee_operations` - `employee_payments` WHERE balance > 0, SUM of positive balances |
| totalPurchases | `number` | `stock_transactions` WHERE `type='inbound'` AND `total_price_paid IS NOT NULL` AND date in range |

### PipelineStage

One instance per stage; 6 total (always rendered, even if count = 0).

| Field | Type | Notes |
|-------|------|-------|
| label | `string` | Arabic stage name |
| count | `number` | Piece count at this stage |
| href | `string` | Navigation target path |

Stage-to-href mapping:
| Stage | Label | href |
|-------|-------|------|
| 1 — Not distributed | غير موزعة | `/cutting` |
| 2 — In distribution | في التوزيع | `/distribution` |
| 3 — Returned, awaiting QC | مُعادة — بانتظار مراقبة | `/distribution` |
| 4 — QC complete, awaiting finition | جاهزة للتشطيب | `/qc` |
| 5 — In finition | في التشطيب | `/qc` |
| 6 — Final stock | المخزون النهائي | `/final-stock` |

### Chart Point Types

**MonthlyProductionPoint** — one per calendar month (up to 12):

| Field | Type | Notes |
|-------|------|-------|
| month | `string` | `'YYYY-MM'` format |
| pieces | `number` | Pieces reaching final stock that month |

Months with no production are filled client-side with `pieces: 0`.

**TopTailorPoint** — up to 5 entries:

| Field | Type | Notes |
|-------|------|-------|
| name | `string` | Tailor name |
| returned | `number` | Total quantity returned in date range |

**TopModelPoint** — up to 5 entries:

| Field | Type | Notes |
|-------|------|-------|
| modelName | `string` | Model name |
| pieces | `number` | Total pieces currently in final stock |

Not date-filtered; always shows all-time totals.

**FabricConsumptionPoint** — one per month (up to 6), pivot by fabric:

| Field | Type | Notes |
|-------|------|-------|
| month | `string` | `'YYYY-MM'` format |
| [fabricName] | `number` | Meters consumed for that fabric |

Dynamic keys: one key per distinct fabric item. Client-side pivot from raw `(fabric_name, month, meters)` rows.

**EmployeeDebtPoint** — one per employee with positive balance:

| Field | Type | Notes |
|-------|------|-------|
| name | `string` | Employee name |
| balance | `number` | Amount owed (always > 0) |

Employees with zero or negative balance are excluded.

### DashboardChartData

Composite type returned by `dashboard:getChartData`. All fields affected by date range and/or model filter.

| Field | Type | Filter scope |
|-------|------|-------------|
| monthlyProduction | `MonthlyProductionPoint[]` | Date range + model |
| topTailors | `TopTailorPoint[]` | Date range + model |
| topModels | `TopModelPoint[]` | None (all-time, all models) |
| fabricConsumption | `FabricConsumptionPoint[]` | Date range only |
| employeeDebt | `EmployeeDebtPoint[]` | None (current state) |

### ActivityEntry

One of up to 20 most recent operations across all operation types.

| Field | Type | Notes |
|-------|------|-------|
| id | `string` | Source record ID |
| type | `'cutting_session' \| 'distribution' \| 'return' \| 'qc' \| 'finition' \| 'final_stock'` | Operation type |
| modelName | `string \| null` | Associated model (null if not applicable) |
| eventDate | `number` | Unix timestamp (ms) |

Navigation targets per type:
| type | Navigation |
|------|-----------|
| cutting_session | `/cutting?id={id}` |
| distribution | `/distribution?id={id}` |
| return | `/distribution?id={id}` |
| qc | `/qc?id={id}` |
| finition | `/qc?id={id}` |
| final_stock | `/final-stock` |

### DashboardFilters

URL-persisted filter state.

| Field | Type | URL param | Default |
|-------|------|-----------|---------|
| startDate | `number` | `from` | First ms of current calendar month |
| endDate | `number` | `to` | Last ms of current calendar month |
| modelName | `string` | `model` | `''` (all models) |

---

## Source Tables (read-only reference)

| Table | Role in Dashboard |
|-------|-------------------|
| `stock_items` | Fabric KPI (unit='متر'), zero-stock KPI |
| `stock_transactions` | Fabric available meters, purchases KPI, fabric consumption chart |
| `cutting_pieces` | Pipeline stages 1–2 |
| `cutting_sessions` | Activity feed |
| `distribution_batches` | Active tailors KPI, activity feed |
| `return_records` | Pipeline stage 3, top tailors chart, activity feed |
| `qc_records` | Pipeline stage 4, activity feed |
| `finition_records` | Pipeline stage 5, activity feed |
| `final_stock_entries` | Pipeline stage 6, top models chart, monthly production chart, activity feed |
| `employees` | Employee debt KPI, employee debt chart |
| `employee_operations` | Employee debt computation |
| `employee_payments` | Employee debt computation |
| `tailors` | Top tailors chart (name join) |
