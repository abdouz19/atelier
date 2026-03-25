# Data Model: Cutting, Distribution, QC & Finition Flow Finalization

**Branch**: `015-consumed-materials-flows` | **Date**: 2026-03-25

---

## Schema Changes

### 1. `cutting_session_parts` — Add `size_label`

`size_label` moves from the session level to each part row. This allows one cutting session to produce parts of different sizes.

```sql
ALTER TABLE cutting_session_parts ADD COLUMN size_label TEXT NOT NULL DEFAULT '';
```

The `cutting_parts` aggregate table (`UNIQUE(model_name, size_label, color, part_name)`) is unaffected — its unique key already included `size_label`. The source of `size_label` for the aggregate upsert now comes from each `cutting_session_parts` row instead of from `cutting_sessions`.

### 2. `cutting_sessions` — `size_label` Deprecated

`size_label` on `cutting_sessions` is no longer written by new sessions. The column is kept (SQLite does not support DROP COLUMN portably) but set to `''` or `NULL` for all new rows. No migration of existing rows is needed — existing data remains valid.

### 3. New Table: `distribution_consumption_entries`

Tracks non-fabric materials consumed during a distribution (handoff to tailor) operation. Mirrors the existing `return_consumption_entries` pattern.

```sql
CREATE TABLE IF NOT EXISTS distribution_consumption_entries (
  id            TEXT PRIMARY KEY,
  batch_id      TEXT NOT NULL REFERENCES distribution_batches(id),
  stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
  color         TEXT,
  quantity      REAL NOT NULL CHECK(quantity > 0),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

Each row in this table also has a corresponding row in `stock_transactions`:
- `type = 'consumed'`
- `source_module = 'distribution'`
- `source_reference_id = batch_id`

---

## Unchanged Existing Tables (Used by This Feature)

### `cutting_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| fabric_item_id | TEXT FK | References `stock_items` |
| fabric_color | TEXT | Color of the fabric used |
| model_name | TEXT | From `models` lookup |
| size_label | TEXT | **Deprecated** — kept for backward compat, new rows write `''` |
| meters_used | REAL | Validated ≤ available stock |
| layers | INTEGER | Number of layers cut |
| price_per_layer | REAL | Cost per layer |
| session_date | TEXT | ISO date |
| notes | TEXT | Optional |
| created_at | TEXT | |
| updated_at | TEXT | |

### `cutting_session_parts` (after migration)
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| session_id | TEXT FK | References `cutting_sessions` |
| part_name | TEXT | From `parts` lookup |
| size_label | TEXT | **NEW** — from `sizes` lookup |
| count | INTEGER | Quantity produced |
| created_at | TEXT | |
| updated_at | TEXT | |

### `cutting_parts` (aggregate, unchanged)
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| model_name | TEXT | |
| size_label | TEXT | Now sourced from `cutting_session_parts.size_label` |
| color | TEXT | From session `fabric_color` |
| part_name | TEXT | |
| count | INTEGER | Aggregate total; upsert ON CONFLICT adds to count |
| UNIQUE | — | `(model_name, size_label, color, part_name)` |

### `stock_transactions`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| stock_item_id | TEXT FK | |
| type | TEXT | `'inbound'` or `'consumed'` |
| quantity | REAL | Always positive |
| color | TEXT | Nullable — variant identifier |
| source_module | TEXT | `'cutting'`, `'distribution'`, `'qc'`, `'finition'` |
| source_reference_id | TEXT | ID of the source record |
| model_name | TEXT | Informational |
| transaction_date | TEXT | |

### `return_consumption_entries` (unchanged, for reference)
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| return_id | TEXT FK | References `return_records` |
| stock_item_id | TEXT FK | |
| color | TEXT | Nullable |
| quantity | REAL | |

### `distribution_batches` (unchanged)
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| tailor_id | TEXT FK | |
| model_name | TEXT | |
| size_label | TEXT | Nullable |
| color | TEXT | Nullable |
| quantity | INTEGER | Total pieces distributed |
| expected_pieces_count | INTEGER | |
| sewing_price_per_piece | REAL | |
| total_cost | REAL | |
| distribution_date | TEXT | |

---

## Key Entity Relationships

```
cutting_sessions (1) ──< cutting_session_parts (N)   [parts produced per session]
cutting_session_parts   ──> cutting_parts              [aggregate upsert]

distribution_batches (1) ──< distribution_batch_parts (N)
distribution_batches (1) ──< distribution_consumption_entries (N)  [NEW]
distribution_consumption_entries ──> stock_transactions             [NEW]

return_records (1) ──< return_consumption_entries (N)
return_consumption_entries ──> stock_transactions

qc_records (1) ──< qc_consumption_entries (N)
qc_consumption_entries ──> stock_transactions

finition_records (1) ──< finition_consumption_entries (N)
finition_consumption_entries ──> stock_transactions
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| `cutting_sessions.meters_used` | Must be ≤ available stock for `(fabric_item_id, fabric_color)` at time of save |
| `cutting_session_parts[].count` | Integer ≥ 1 |
| `cutting_session_parts[].size_label` | Non-empty string |
| `cutting_session_parts[].part_name` | Non-empty string |
| `*_consumption_entries[].quantity` | Must be ≤ available stock for `(stock_item_id, color)` at time of save |
| `*_consumption_entries[].stock_item_id` | Must reference a non-fabric stock item |
| Consumed materials rows | Blank item or quantity = 0 rows must be ignored or rejected |

---

## State Transitions

### Cutting Session Submission
1. Validate fabric availability → reject if insufficient
2. Validate each consumption row availability → reject if any insufficient
3. Insert `cutting_sessions` (size_label = '')
4. For each part row: insert `cutting_session_parts` (with size_label), upsert `cutting_parts`
5. Insert fabric deduction → `stock_transactions` (type=consumed, source_module=cutting)
6. For each consumption row: insert `cutting_consumption_entries` + `stock_transactions`
7. For each selected employee: insert `employee_operations`
8. All steps in a single SQLite transaction — rollback on any failure

### Distribution Submission (Extended)
1. Validate parts against `cutting_parts`
2. Validate each consumption row availability
3. Insert `distribution_batches`
4. Insert `distribution_batch_parts`
5. For each consumption row: insert `distribution_consumption_entries` + `stock_transactions`
6. All steps in a single SQLite transaction
