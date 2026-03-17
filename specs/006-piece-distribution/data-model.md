# Data Model: Piece Distribution Management

**Branch**: `006-piece-distribution` | **Date**: 2026-03-15

---

## New Tables

### tailors

Represents a sewing contractor. Independent of the `employees` table.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | Display name |
| phone | TEXT | | Optional |
| notes | TEXT | | Optional |
| status | TEXT | NOT NULL DEFAULT 'active' | 'active' \| 'inactive' |
| created_at | INTEGER | NOT NULL | Epoch ms |
| updated_at | INTEGER | NOT NULL | Epoch ms |

**Indexes**:
- `idx_tailors_status` ON tailors(status)

---

### tailor_payments

A payment made to a tailor, reducing their outstanding balance.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | UUID |
| tailor_id | TEXT | NOT NULL, FK → tailors(id) | |
| amount | REAL | NOT NULL, CHECK > 0 | |
| payment_date | INTEGER | NOT NULL | Epoch ms |
| notes | TEXT | | Optional |
| created_at | INTEGER | NOT NULL | Epoch ms |
| updated_at | INTEGER | NOT NULL | Epoch ms |

**Indexes**:
- `idx_tailor_payments_tailor` ON tailor_payments(tailor_id)

**Mutability**: Editable and deletable (for error correction).

---

### distribution_batches

One record per distribution event — pieces sent to a tailor for sewing.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | UUID |
| tailor_id | TEXT | NOT NULL, FK → tailors(id) | Must be active at time of creation |
| model_name | TEXT | NOT NULL | From cutting session |
| size_label | TEXT | NOT NULL | From cutting piece |
| color | TEXT | NOT NULL | From cutting session fabric_color |
| quantity | INTEGER | NOT NULL, CHECK > 0 | Number of pieces distributed |
| sewing_price_per_piece | REAL | NOT NULL, CHECK > 0 | |
| total_cost | REAL | NOT NULL, CHECK > 0 | = quantity × sewing_price_per_piece |
| distribution_date | INTEGER | NOT NULL | Epoch ms |
| created_at | INTEGER | NOT NULL | Epoch ms |
| updated_at | INTEGER | NOT NULL | Epoch ms |

**Derived field**: `remaining_quantity = quantity - SUM(return_records.quantity_returned WHERE batch_id = id)`

**Indexes**:
- `idx_distribution_batches_tailor` ON distribution_batches(tailor_id)
- `idx_distribution_batches_date` ON distribution_batches(distribution_date)

**Mutability**: Immutable after creation.

---

### distribution_piece_links

Join table binding specific `cutting_pieces` IDs to a distribution batch. Enables exact piece-level audit trail.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | UUID |
| batch_id | TEXT | NOT NULL, FK → distribution_batches(id) | |
| piece_id | TEXT | NOT NULL, FK → cutting_pieces(id) | Must have status='not_distributed' at creation |
| created_at | INTEGER | NOT NULL | Epoch ms |

**Indexes**:
- `idx_dist_piece_links_batch` ON distribution_piece_links(batch_id)
- `idx_dist_piece_links_piece` ON distribution_piece_links(piece_id)

**Note**: No `updated_at` — append-only join table. One row per piece per batch.

---

### return_records

One record per return event — pieces returned from a tailor.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | UUID |
| batch_id | TEXT | NOT NULL, FK → distribution_batches(id) | |
| quantity_returned | INTEGER | NOT NULL, CHECK > 0 | Must not exceed remaining distributed quantity |
| return_date | INTEGER | NOT NULL | Epoch ms |
| created_at | INTEGER | NOT NULL | Epoch ms |
| updated_at | INTEGER | NOT NULL | Epoch ms |

**Indexes**:
- `idx_return_records_batch` ON return_records(batch_id)

**Mutability**: Immutable after creation.

---

### return_consumption_entries

Non-fabric stock items consumed during sewing, recorded at return time.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | UUID |
| return_id | TEXT | NOT NULL, FK → return_records(id) | |
| stock_item_id | TEXT | NOT NULL, FK → stock_items(id) | type ≠ 'قماش' |
| color | TEXT | | NULL if item has no color variants |
| quantity | REAL | NOT NULL, CHECK > 0 | |
| created_at | INTEGER | NOT NULL | Epoch ms |
| updated_at | INTEGER | NOT NULL | Epoch ms |

**Indexes**:
- `idx_return_consumption_return` ON return_consumption_entries(return_id)

**Mutability**: Immutable after creation.

---

## Existing Tables Modified

### cutting_pieces (existing)

The `status` column gains the `'returned'` state.

**State transitions**:
```
not_distributed → distributed  (on distribution:distribute)
distributed     → returned     (on distribution:return)
```

No schema change required — the status column is TEXT with no CHECK constraint blocking 'returned'.

---

## Existing Tables Used (No Schema Changes)

### stock_transactions (existing)

Return consumption deductions written here on return submission.

- `type` = `'consumed'`
- `source_module` = `'distribution'`
- `source_reference_id` = return record id
- `quantity` = consumption entry quantity
- `color` = consumption entry color

---

## Migration SQL

```sql
CREATE TABLE IF NOT EXISTS tailors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tailors_status ON tailors(status);

CREATE TABLE IF NOT EXISTS tailor_payments (
  id TEXT PRIMARY KEY,
  tailor_id TEXT NOT NULL REFERENCES tailors(id),
  amount REAL NOT NULL CHECK (amount > 0),
  payment_date INTEGER NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tailor_payments_tailor ON tailor_payments(tailor_id);

CREATE TABLE IF NOT EXISTS distribution_batches (
  id TEXT PRIMARY KEY,
  tailor_id TEXT NOT NULL REFERENCES tailors(id),
  model_name TEXT NOT NULL,
  size_label TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  sewing_price_per_piece REAL NOT NULL CHECK (sewing_price_per_piece > 0),
  total_cost REAL NOT NULL CHECK (total_cost > 0),
  distribution_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_distribution_batches_tailor ON distribution_batches(tailor_id);
CREATE INDEX IF NOT EXISTS idx_distribution_batches_date ON distribution_batches(distribution_date);

CREATE TABLE IF NOT EXISTS distribution_piece_links (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES distribution_batches(id),
  piece_id TEXT NOT NULL REFERENCES cutting_pieces(id),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dist_piece_links_batch ON distribution_piece_links(batch_id);
CREATE INDEX IF NOT EXISTS idx_dist_piece_links_piece ON distribution_piece_links(piece_id);

CREATE TABLE IF NOT EXISTS return_records (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES distribution_batches(id),
  quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
  return_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_return_records_batch ON return_records(batch_id);

CREATE TABLE IF NOT EXISTS return_consumption_entries (
  id TEXT PRIMARY KEY,
  return_id TEXT NOT NULL REFERENCES return_records(id),
  stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
  color TEXT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_return_consumption_return ON return_consumption_entries(return_id);
```
