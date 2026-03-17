# Research: Distribution & Dashboard Pieces Availability Enhancement

**Feature**: 012-pieces-availability | **Phase**: 0 | **Date**: 2026-03-17

---

## Decision: Pieces Availability Query Strategy

- **Decision**: Join `cutting_pieces` with `cutting_sessions` for all piece-level counts (total produced, not_distributed, in_distribution, returned). Use `cutting_pieces.status` for classification.
- **Rationale**: `cutting_pieces` is the authoritative record for individual pieces. It has `part_name`, `size_label`, `color` (via ALTER TABLE) and its `status` field tracks the piece lifecycle through not_distributed → distributed → returned. The session join provides `model_name` and `fabric_color`.
- **Finding**: `cutting_pieces` does NOT have a `model_name` column — model comes from `cutting_sessions.model_name`. Color comes from `cutting_sessions.fabric_color` (the ALTER TABLE `color` column on cutting_pieces may be null for older pieces; use the session color for consistency with the existing `getAvailablePieces` handler).

### Availability grouping SQL

```sql
SELECT
  cs.model_name,
  cp.part_name,
  cp.size_label,
  cs.fabric_color AS color,
  COUNT(*) AS total_produced,
  SUM(CASE WHEN cp.status = 'not_distributed' THEN 1 ELSE 0 END) AS not_distributed,
  SUM(CASE WHEN cp.status = 'distributed' THEN 1 ELSE 0 END) AS in_distribution,
  SUM(CASE WHEN cp.status = 'returned' THEN 1 ELSE 0 END) AS returned
FROM cutting_pieces cp
JOIN cutting_sessions cs ON cs.id = cp.session_id
GROUP BY cs.model_name, cp.part_name, cp.size_label, cs.fabric_color
ORDER BY cs.model_name, cp.part_name, cp.size_label, cs.fabric_color
```

Filters are applied as `(? IS NULL OR cs.model_name = ?)` pattern per column.

**Note on QC/finition/finalStock**: These stages track aggregate quantities via return_records → qc_records → finition_records → final_stock_entries, linked at the batch (model+size+color) level, not the individual cutting_piece level. They cannot be reliably attributed to a specific part_name without adding part_name to all downstream tables (out of scope). These columns are omitted from the initial availability breakdown for accuracy; the screen shows 4 counts: total produced, not distributed, in distribution, returned.

---

## Decision: Distribution Modal Availability Table Query

- **Decision**: New IPC channel `distribution:getAvailabilityForModel` returns all (part_name, size_label, color) combinations for a model with their not_distributed count, including zero-count rows.

```sql
SELECT
  cp.part_name,
  cp.size_label,
  cs.fabric_color AS color,
  SUM(CASE WHEN cp.status = 'not_distributed' THEN 1 ELSE 0 END) AS not_distributed_count
FROM cutting_pieces cp
JOIN cutting_sessions cs ON cs.id = cp.session_id
WHERE cs.model_name = ?
GROUP BY cp.part_name, cp.size_label, cs.fabric_color
ORDER BY not_distributed_count DESC, cp.part_name, cp.size_label, cs.fabric_color
```

Returns all combinations ever produced for the model (including those at zero), sorted with highest availability first.

---

## Decision: Schema Changes Required

### 1. `part_name TEXT` on `distribution_batches`

- **Decision**: Add `part_name TEXT` (nullable) to `distribution_batches` via idempotent ALTER TABLE migration
- **Rationale**: When the manager selects a (part, size, color) row from the availability table, the resulting distribution batch must record which part it belongs to. Without this column, part information is lost after distribution.
- **Migration**: `ALTER TABLE distribution_batches ADD COLUMN part_name TEXT` — same idempotent pattern used in main.js for prior migrations

### 2. New `app_settings` table

- **Decision**: Add a key-value `app_settings` table for persistent app-wide configuration
- **Rationale**: The constitution mandates "NEVER use localStorage for persistent data (use SQLite)". The low-stock threshold must survive app restarts. A simple key-value table is the minimal schema that satisfies this requirement without introducing an unnecessary settings screen.
- **Schema**:
  ```sql
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
  ```
- **Default**: Insert `('low_stock_threshold', '5', <now>)` on first access if the key doesn't exist (INSERT OR IGNORE)

---

## Decision: IPC Channel Architecture

- **Decision**: 4 new channels + 1 modified channel

| Channel | Type | Purpose |
|---------|------|---------|
| `distribution:getAvailabilityForModel` | NEW | Returns grouped (part+size+color) availability for a model — used by the distribution modal table |
| `pieces:getAvailability` | NEW | Full availability breakdown with filters — used by the Pieces Availability screen |
| `pieces:getLowStockThreshold` | NEW | Returns current threshold value from app_settings |
| `pieces:setLowStockThreshold` | NEW | Saves threshold to app_settings |
| `dashboard:getSnapshotData` | MODIFIED | Add zero-stock combo count, low-stock combo count, top-10 critical widget, and monthly distributed series to existing response |

**Rationale for modifying `dashboard:getSnapshotData`**: The two new KPI counts (zero-stock combos, low-stock combos) are snapshot values (current state, not date-filtered) — they belong in the snapshot channel. The top-10 widget is also snapshot data.

**Rationale for modifying `dashboard:getChartData` instead**: The monthly distributed series IS date-filtered (like the existing production series), so it's added to the `dashboard:getChartData` response alongside the existing `monthlyProduction` array.

---

## Decision: Monthly Distributed Series

- **Decision**: New SQL added to `getChartData` in dashboard queries:

```sql
SELECT
  strftime('%Y-%m', datetime(db.distribution_date / 1000, 'unixepoch')) AS month,
  SUM(db.quantity) AS distributed
FROM distribution_batches db
WHERE db.distribution_date >= ?  -- 12 months ago
  AND (? IS NULL OR db.model_name = ?)
GROUP BY month
ORDER BY month ASC
```

- **Rationale**: `distribution_batches.distribution_date` and `quantity` give the total pieces distributed per month per model. This parallel data to `final_stock_entries` enables the production-vs-distribution gap chart.
- **Client-side merge**: The two series (monthlyProduction from final_stock_entries, monthlyDistributed from distribution_batches) share the same 12-month month keys. Client fills gaps with 0 for both. Already handled by the existing `fillMonthGaps` utility pattern.

---

## Decision: DistributePayload Extension

- **Decision**: Add optional `partName?: string | null` to `DistributePayload`
- **Rationale**: The new modal flow selects a (part, size, color) row, so part must be sent to the handler for insertion into `distribution_batches.part_name`. Nullable to maintain backward compatibility with any path that doesn't supply it.
- **Handler update**: `distribution:distribute` handler inserts `partName ?? null` into `distribution_batches.part_name`

---

## Decision: Low-Stock Threshold — Read/Write Pattern

- **Decision**: Threshold is read once on `pieces:getLowStockThreshold` call; written on `pieces:setLowStockThreshold`. The Pieces Availability screen fetches it on mount and applies it locally to classify rows. Changing it triggers an immediate re-classification client-side (no re-fetch of piece data needed).
- **Default value**: 5 (applied when key is absent from app_settings)

---

## Decision: Dashboard Snapshot Data Additions

New fields added to `dashboard:getSnapshotData` response:

```javascript
// Zero-stock combos
SELECT COUNT(*) AS cnt FROM (
  SELECT cs.model_name, cp.part_name, cp.size_label, cs.fabric_color
  FROM cutting_pieces cp JOIN cutting_sessions cs ON cs.id = cp.session_id
  GROUP BY cs.model_name, cp.part_name, cp.size_label, cs.fabric_color
  HAVING SUM(CASE WHEN cp.status='not_distributed' THEN 1 ELSE 0 END) = 0
)

// Low-stock combos (threshold passed as parameter)
HAVING SUM(CASE WHEN cp.status='not_distributed' THEN 1 ELSE 0 END) BETWEEN 1 AND ?

// Top 10 critical (zero + lowest not_distributed)
SELECT cs.model_name, cp.part_name, cp.size_label, cs.fabric_color AS color,
  SUM(CASE WHEN cp.status='not_distributed' THEN 1 ELSE 0 END) AS not_distributed
FROM cutting_pieces cp JOIN cutting_sessions cs ON cs.id = cp.session_id
GROUP BY cs.model_name, cp.part_name, cp.size_label, cs.fabric_color
ORDER BY not_distributed ASC
LIMIT 10
```

The snapshot handler reads the current threshold from `app_settings` to compute the low-stock combo count.

---

## Decision: Pieces Availability Screen Location

- **Decision**: New tab within the Distribution screen (tab switcher: "التوزيع" | "توافر القطع")
- **Rationale**: The spec says "new tab or section inside Distribution screen". A tab switcher (matching existing multi-tab screens in the project) keeps the feature co-located with distribution without adding a sidebar item.
- **Navigation**: URL param `?tab=availability` distinguishes the tab; `useSearchParams` manages it

---

## Decision: DistributeModal Refactor

- **Decision**: The existing `DistributeModal` is modified — after model selection, the `sizeLabel`, `color`, and `partName` fields are replaced by a `AvailabilityTableSelector` sub-component that shows the grouped availability table. Selecting a row sets all three values at once. The `quantity` and `sewingPricePerPiece` fields remain unchanged.
- **useDistributeForm hook**: Gains a `selectedCombination` state; fetches availability table via `distribution:getAvailabilityForModel` when model changes; existing `getAvailablePieces` call is replaced by reading the selected combination's `not_distributed_count` directly from the table response.
