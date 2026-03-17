# Data Model: Distribution & Dashboard Pieces Availability Enhancement

**Feature**: 012-pieces-availability | **Date**: 2026-03-17

---

## Schema Changes (existing tables)

### `distribution_batches` — ADD COLUMN `part_name TEXT`

New nullable column. Existing rows get NULL (no part tracked). New distributions created via the availability table selection store the selected `part_name`.

| Column | Type | Notes |
|--------|------|-------|
| part_name | TEXT (nullable) | Null for batches created before this feature or without part selection |

Migration: `ALTER TABLE distribution_batches ADD COLUMN part_name TEXT` (idempotent — wrapped in try/catch)

---

## New Tables

### `app_settings`

Persistent key-value store for application configuration. Replaces any need for localStorage/files for settings.

| Column | Type | Constraints |
|--------|------|-------------|
| key | TEXT | PRIMARY KEY |
| value | TEXT | NOT NULL |
| updated_at | INTEGER | NOT NULL — Unix timestamp ms |

**Seed on first access** (INSERT OR IGNORE):
- key=`'low_stock_threshold'`, value=`'5'`

---

## Derived Entities

### AvailabilityCombination

Returned by `distribution:getAvailabilityForModel`. One row per distinct (part, size, color) combination that has ever been produced for a given model.

| Field | Type | Source |
|-------|------|--------|
| partName | `string \| null` | `cutting_pieces.part_name` |
| sizeLabel | `string` | `cutting_pieces.size_label` |
| color | `string` | `cutting_sessions.fabric_color` |
| notDistributedCount | `number` | COUNT WHERE status='not_distributed' |

**Rules**:
- Zero-count rows are included (shown disabled in the modal table)
- Ordered by `notDistributedCount DESC` then part/size/color alphabetically

### PiecesAvailabilityRow

Returned by `pieces:getAvailability`. Full breakdown per combination across all stages trackable at piece level.

| Field | Type | Source |
|-------|------|--------|
| modelName | `string` | `cutting_sessions.model_name` |
| partName | `string \| null` | `cutting_pieces.part_name` |
| sizeLabel | `string` | `cutting_pieces.size_label` |
| color | `string` | `cutting_sessions.fabric_color` |
| totalProduced | `number` | COUNT(*) all pieces for this combination |
| notDistributed | `number` | COUNT WHERE status='not_distributed' |
| inDistribution | `number` | COUNT WHERE status='distributed' |
| returned | `number` | COUNT WHERE status='returned' |

**Classification** (client-side, based on threshold):
- `notDistributed === 0` → **zero** (red)
- `notDistributed > 0 && notDistributed <= threshold` → **low** (amber)
- `notDistributed > threshold` → **ok** (no flag)

### CriticalCombination

Used in the Dashboard's top-10 widget. Subset of PiecesAvailabilityRow.

| Field | Type | Notes |
|-------|------|-------|
| modelName | `string` | |
| partName | `string \| null` | |
| sizeLabel | `string` | |
| color | `string` | |
| notDistributed | `number` | |

Ordered by `notDistributed ASC` (zeros first), LIMIT 10.

### MonthlyDistributedPoint

New chart series added to `DashboardChartData.monthlyDistributed`.

| Field | Type | Notes |
|-------|------|-------|
| month | `string` | 'YYYY-MM' format |
| distributed | `number` | SUM(distribution_batches.quantity) for that month |

Client fills gaps with `distributed: 0` for months with no distributions. Merged with `monthlyProduction` on the same month key.

---

## Extended Existing Entities

### `DistributePayload` — added field

| Field | Type | Notes |
|-------|------|-------|
| partName | `string \| null \| undefined` | Optional; null for older modal paths; set from AvailabilityCombination selection |

### `DashboardSnapshotKpis` — added fields

| Field | Type | Notes |
|-------|------|-------|
| zeroStockCombosCount | `number` | Distinct (model+part+size+color) combinations with notDistributed = 0 |
| lowStockCombosCount | `number` | Distinct combinations with 0 < notDistributed ≤ threshold |

### `DashboardSnapshotData` — added field

| Field | Type | Notes |
|-------|------|-------|
| criticalCombinations | `CriticalCombination[]` | Top 10 by ascending notDistributed |

### `DashboardChartData` — added field

| Field | Type | Notes |
|-------|------|-------|
| monthlyDistributed | `MonthlyDistributedPoint[]` | Raw rows from DB; client fills 12-month gaps |

---

## Data Flow: Distribution Modal Selection

```
User selects model
  → distribution:getAvailabilityForModel(modelName)
  → returns AvailabilityCombination[]
  → AvailabilityTableSelector renders rows
  → User selects row (part, size, color, max = notDistributedCount)
  → Quantity input appears with max constraint
  → distribution:distribute({ ..., partName, sizeLabel, color, quantity, ... })
  → distribution_batches INSERT with part_name
```

## Data Flow: Pieces Availability Tab

```
User navigates to ?tab=availability
  → usePiecesAvailability mounts
  → parallel: pieces:getAvailability({}) + pieces:getLowStockThreshold()
  → PiecesAvailabilityTable renders with classification
  → User changes threshold input
  → pieces:setLowStockThreshold({ threshold }) + local state update
  → rows reclassified client-side (no re-fetch)
  → User clicks "قطع مرة أخرى" on flagged row
  → router.push('/cutting?modelName=...&color=...')
```
