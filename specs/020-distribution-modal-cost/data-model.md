# Data Model: Distribution Modal Redesign & Cost Calculation

**Feature**: 020-distribution-modal-cost
**Phase**: 1 — Design
**Date**: 2026-04-03

---

## Entities

### 1. distribution_batches (updated)

Primary distribution record. Represents one distribution event from production to a tailor.

**Existing columns** (unchanged):
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| tailor_id | TEXT | NOT NULL, FK→tailors | Assigned tailor |
| model_name | TEXT | NOT NULL | Garment model |
| size_label | TEXT | | Size |
| color | TEXT | | Fabric color |
| part_name | TEXT | | Legacy single-part name (kept for backward compat) |
| quantity | INTEGER | NOT NULL, CHECK >0 | Total pieces distributed |
| expected_pieces_count | INTEGER | NOT NULL DEFAULT 0 | Expected finished garments (= expected_final_quantity) |
| sewing_price_per_piece | REAL | NOT NULL | Sewing price per finished garment |
| total_cost | REAL | NOT NULL | Total distribution cost (pieces + sewing + materials) |
| distribution_date | INTEGER | NOT NULL | Unix timestamp ms |
| created_at | INTEGER | NOT NULL | |
| updated_at | INTEGER | NOT NULL | |

**New columns** (020 migration — added via table recreation):
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| pieces_cost | REAL | | Sum of (qty × avg_unit_cost) across all part rows |
| sewing_cost | REAL | | expected_pieces_count × sewing_price_per_piece (= tailor earnings) |
| materials_cost | REAL | | Sum of batch consumption costs |
| cost_per_final_item | REAL | | total_cost ÷ expected_pieces_count |

**Constraint changes** (via recreation):
- `sewing_price_per_piece`: CHECK changed from `> 0` to `>= 0` (free sewing allowed)
- `total_cost`: CHECK changed from `> 0` to `>= 0` (zero-cost edge case)

**State**: Immutable after creation. No updates. No hard deletes.

---

### 2. distribution_batch_parts (updated)

One row per part given in a distribution. Stores part identity, distributed quantity, and cost at time of distribution.

**Existing columns** (unchanged):
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| batch_id | TEXT | NOT NULL, FK→distribution_batches | Parent distribution |
| part_name | TEXT | NOT NULL | Part name |
| quantity | INTEGER | NOT NULL, CHECK >0 | Pieces distributed for this part |
| created_at | INTEGER | NOT NULL | |
| updated_at | INTEGER | NOT NULL | |

**New column** (020 migration — idempotent ALTER TABLE):
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| avg_unit_cost | REAL | | Average unit cost at time of distribution (for QC/finition traceability) |

---

### 3. distribution_piece_links (existing — used more actively)

Associates individual cutting pieces with a distribution record, recording the status change from `not_distributed` to `distributed`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| batch_id | TEXT | NOT NULL, FK→distribution_batches | Parent distribution |
| piece_id | TEXT | NOT NULL, FK→cutting_pieces | Linked piece |
| created_at | INTEGER | NOT NULL | |

**Usage**: One row inserted per piece distributed. `cutting_pieces.status` is updated to `'distributed'` in the same transaction.

---

### 4. cutting_pieces (existing — status field now updated by distributions)

Individual piece tracking. Already has `status` field with `not_distributed | distributed | returned`.

**Relevant columns**:
| Column | Description |
|--------|-------------|
| id | UUID |
| session_id | FK→cutting_sessions |
| part_name | Part name (nullable) |
| size_label | Size label |
| color | Fabric color (nullable) |
| status | `not_distributed` \| `distributed` \| `returned` |
| unit_cost | Unit cost from 018 migration (nullable — 0 if not set) |

**Status transition for this feature**: `not_distributed` → `distributed` (on distribution submission).

---

### 5. cutting_session_parts (existing — read-only for avg unit cost)

Per-session part cost log. Used to compute average unit cost for the part selector.

**Relevant columns**:
| Column | Description |
|--------|-------------|
| session_id | FK→cutting_sessions |
| part_name | Part name |
| size_label | Size label |
| unit_cost | Cost per piece for this session (nullable — 0 if not set) |

---

### 6. distribution_consumption_entries (existing — used for materials)

One row per stock batch consumed during a distribution.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| batch_id | TEXT | NOT NULL, FK→distribution_batches | Parent distribution |
| stock_transaction_id | TEXT | NOT NULL, FK→stock_transactions | Source inbound transaction |
| quantity | REAL | NOT NULL | Amount consumed |
| price_per_unit | REAL | NOT NULL | Price at time of consumption |
| created_at | INTEGER | NOT NULL | |
| updated_at | INTEGER | NOT NULL | |

---

## Relationships

```
tailors (1) ─────────────────── (N) distribution_batches
                                           │
                          ┌────────────────┼──────────────────────┐
                          │                │                       │
                     (N) distribution  (N) distribution_piece  (N) distribution_
                         _batch_parts      _links                  consumption_entries
                          │                │                       │
                     cutting_pieces ───────┘              stock_transactions
                     (status update)
```

---

## Key Computed Values

| Field | Formula | Stored On |
|-------|---------|-----------|
| pieces_cost | Σ (part_row.quantity × part_row.avg_unit_cost) | distribution_batches.pieces_cost |
| sewing_cost | expected_pieces_count × sewing_price_per_piece | distribution_batches.sewing_cost |
| materials_cost | Σ (batch.quantity × batch.price_per_unit) per consumption entry | distribution_batches.materials_cost |
| total_cost | pieces_cost + sewing_cost + materials_cost | distribution_batches.total_cost |
| cost_per_final_item | total_cost ÷ expected_pieces_count | distribution_batches.cost_per_final_item |
| avg_unit_cost (per part) | AVG(COALESCE(csp.unit_cost, 0)) for not_distributed pieces of that part+model+size+color | distribution_batch_parts.avg_unit_cost |

---

## Migration Plan (020)

**Step 1** — `distribution_batches` table recreation (to fix CHECK constraints + add new columns):
```sql
-- Same PRAGMA + rename + recreate + INSERT + DROP pattern as 013 migration
PRAGMA foreign_keys = OFF;
ALTER TABLE distribution_batches RENAME TO distribution_batches_old;
CREATE TABLE distribution_batches (
  id                     TEXT    PRIMARY KEY,
  tailor_id              TEXT    NOT NULL REFERENCES tailors(id),
  model_name             TEXT    NOT NULL,
  size_label             TEXT,
  color                  TEXT,
  part_name              TEXT,
  quantity               INTEGER NOT NULL CHECK (quantity > 0),
  expected_pieces_count  INTEGER NOT NULL DEFAULT 0,
  sewing_price_per_piece REAL    NOT NULL CHECK (sewing_price_per_piece >= 0),
  total_cost             REAL    NOT NULL CHECK (total_cost >= 0),
  pieces_cost            REAL,
  sewing_cost            REAL,
  materials_cost         REAL,
  cost_per_final_item    REAL,
  distribution_date      INTEGER NOT NULL,
  created_at             INTEGER NOT NULL,
  updated_at             INTEGER NOT NULL
);
INSERT INTO distribution_batches SELECT id, tailor_id, model_name, size_label, color,
  part_name, quantity, expected_pieces_count, sewing_price_per_piece, total_cost,
  NULL, NULL, NULL, NULL, distribution_date, created_at, updated_at
FROM distribution_batches_old;
DROP TABLE distribution_batches_old;
PRAGMA foreign_keys = ON;
```

**Step 2** — Idempotent ALTER TABLE on `distribution_batch_parts`:
```sql
-- Guarded by try/catch (same pattern as all 018+ migrations)
ALTER TABLE distribution_batch_parts ADD COLUMN avg_unit_cost REAL
```

**Detection guard** (same as all existing migrations):
```js
try { db.prepare('SELECT pieces_cost FROM distribution_batches LIMIT 1').get() }
catch (_) { /* run migration */ }
```
