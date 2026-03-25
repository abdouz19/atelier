# Data Model: Parts Model Correction & Inventory KPIs

**Branch**: `013-parts-distribution-fix` | **Date**: 2026-03-21

---

## New Tables

### `cutting_parts`

Aggregate named parts produced by a cutting session. Replaces the per-piece `cutting_pieces` approach for new sessions.

```sql
CREATE TABLE IF NOT EXISTS cutting_parts (
  id           TEXT    PRIMARY KEY,
  session_id   TEXT    NOT NULL REFERENCES cutting_sessions(id),
  part_name    TEXT    NOT NULL,
  count        INTEGER NOT NULL CHECK (count > 0),
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cutting_parts_session   ON cutting_parts(session_id);
CREATE INDEX IF NOT EXISTS idx_cutting_parts_part_name ON cutting_parts(part_name);
```

**Key rules**:
- `part_name` is free text (e.g., "ظهر", "ذراع يمين", "ياقة"). No enum — the application layer provides autocomplete.
- `count` must be ≥ 1. Zero-count rows are rejected at submission.
- One row per part type per session. The same `part_name` cannot appear twice in the same session.
- Inventory key: `cutting_sessions.model_name` + `cutting_parts.part_name`.

---

### `distribution_batch_parts`

Per-part breakdown for a distribution batch. A batch has one or more part entries.

```sql
CREATE TABLE IF NOT EXISTS distribution_batch_parts (
  id         TEXT    PRIMARY KEY,
  batch_id   TEXT    NOT NULL REFERENCES distribution_batches(id),
  part_name  TEXT    NOT NULL,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dist_batch_parts_batch ON distribution_batch_parts(batch_id);
```

**Key rules**:
- `quantity` must be ≤ available count for that (model_name, part_name) at submission time.
- The same `part_name` cannot appear twice within the same batch.
- On submission, each part's quantity is deducted from the available inventory (computed view).

---

## Modified Tables

### `distribution_batches` — Schema Migration

**Changes required**:
1. Add `expected_pieces_count INTEGER NOT NULL DEFAULT 1` — the expected number of assembled final pieces.
2. Make `size_label` nullable (was `NOT NULL`) — legacy field; new distributions set it to `NULL`.
3. Make `color` nullable (was `NOT NULL`) — legacy field; new distributions set it to `NULL`.

**Migration strategy** (SQLite rename-copy-drop inside a transaction):

```sql
-- Inside initializeDatabase(), wrapped in BEGIN/COMMIT:
ALTER TABLE distribution_batches RENAME TO distribution_batches_old;

CREATE TABLE distribution_batches (
  id                    TEXT    PRIMARY KEY,
  tailor_id             TEXT    NOT NULL REFERENCES tailors(id),
  model_name            TEXT    NOT NULL,
  size_label            TEXT,               -- nullable (legacy)
  color                 TEXT,               -- nullable (legacy)
  part_name             TEXT,               -- nullable (legacy)
  quantity              INTEGER NOT NULL CHECK (quantity > 0),
  expected_pieces_count INTEGER NOT NULL DEFAULT 0,
  sewing_price_per_piece REAL   NOT NULL CHECK (sewing_price_per_piece > 0),
  total_cost            REAL    NOT NULL CHECK (total_cost > 0),
  distribution_date     INTEGER NOT NULL,
  created_at            INTEGER NOT NULL,
  updated_at            INTEGER NOT NULL
);

INSERT INTO distribution_batches SELECT
  id, tailor_id, model_name, size_label, color, part_name,
  quantity, 0 as expected_pieces_count,
  sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at
FROM distribution_batches_old;

DROP TABLE distribution_batches_old;

CREATE INDEX IF NOT EXISTS idx_distribution_batches_tailor ON distribution_batches(tailor_id);
CREATE INDEX IF NOT EXISTS idx_distribution_batches_date   ON distribution_batches(distribution_date);
```

**Note**: The migration runs only if `distribution_batches_old` does not exist (idempotent guard).

---

## Legacy Tables (Retained, Not Modified)

### `cutting_pieces`
Kept as-is. Old sessions (pre-013) have rows here. New sessions use `cutting_parts` instead. No writes from new code; reads only for old session detail views and the 012-pieces-availability screen.

Fields: `id, session_id, size_label TEXT NOT NULL, part_name TEXT, color TEXT, status, created_at, updated_at`

### `distribution_piece_links`
Kept as-is. Old batches (pre-013) have rows here. New batches use `distribution_batch_parts` instead.

---

## Derived View: Parts Inventory

Not a stored table — computed on demand.

```sql
SELECT
  cs.model_name,
  cp.part_name,
  SUM(cp.count) AS total_produced,
  COALESCE(SUM(dbp_totals.distributed), 0) AS total_distributed,
  SUM(cp.count) - COALESCE(SUM(dbp_totals.distributed), 0) AS available_count
FROM cutting_parts cp
JOIN cutting_sessions cs ON cs.id = cp.session_id
LEFT JOIN (
  SELECT db.model_name, dbp.part_name, SUM(dbp.quantity) AS distributed
  FROM distribution_batch_parts dbp
  JOIN distribution_batches db ON db.id = dbp.batch_id
  GROUP BY db.model_name, dbp.part_name
) dbp_totals ON dbp_totals.model_name = cs.model_name AND dbp_totals.part_name = cp.part_name
GROUP BY cs.model_name, cp.part_name
ORDER BY cs.model_name, cp.part_name
```

**Formula**: `available = produced − distributed`
Returns are tracked at the batch level (flat count) and do not feed back into per-part inventory counts (see research.md §3).

---

## State Transitions

### Batch Lifecycle (Distribution)

```
Created (quantity=N, expected_pieces_count=E)
  └─► Partial Return: quantity_returned < N  →  remaining = N - Σ(quantity_returned)
  └─► Full Return:    Σ(quantity_returned) = N  →  batch fully returned
```

`return_records.quantity_returned` sums against the batch. The remaining quantity is computed:
```sql
SELECT
  db.id,
  db.quantity,
  COALESCE(SUM(rr.quantity_returned), 0) AS total_returned,
  db.quantity - COALESCE(SUM(rr.quantity_returned), 0) AS remaining
FROM distribution_batches db
LEFT JOIN return_records rr ON rr.batch_id = db.id
GROUP BY db.id
```

---

## Drizzle Schema Reference Files (update required)

| File | Change |
|------|--------|
| `electron/db/schema/cutting_piece.ts` | No change — legacy |
| `electron/db/schema/cutting_part.ts` | **Create new** — `cutting_parts` table |
| `electron/db/schema/distribution_batch.ts` | Update — add `expected_pieces_count`, nullable `size_label`/`color` |
| `electron/db/schema/distribution_batch_part.ts` | **Create new** — `distribution_batch_parts` table |
