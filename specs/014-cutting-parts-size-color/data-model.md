# Data Model: Cutting Parts Size/Color Enhancements

## Schema Changes

### 1. `cutting_sessions` — Add `size_label` column

**Change type**: `ALTER TABLE ... ADD COLUMN` (migration, idempotent)

```sql
ALTER TABLE cutting_sessions ADD COLUMN size_label TEXT NOT NULL DEFAULT ''
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| size_label | TEXT | NOT NULL DEFAULT '' | Size from sizes lookup; empty string for legacy rows |

---

### 2. `cutting_session_parts` — New table (log per session)

**Change type**: `CREATE TABLE IF NOT EXISTS` (new table)

```sql
CREATE TABLE IF NOT EXISTS cutting_session_parts (
  id         TEXT    PRIMARY KEY,
  session_id TEXT    NOT NULL REFERENCES cutting_sessions(id),
  part_name  TEXT    NOT NULL,
  count      INTEGER NOT NULL CHECK (count > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
```

**Purpose**: Per-session production log. Used by `cutting:getById` to show what was cut in a specific session. Does not accumulate — one row per session+part.

**Index**: `idx_cutting_session_parts_session ON cutting_session_parts(session_id)`

---

### 3. `cutting_parts` — Redesign as aggregate inventory table

**Change type**: Rename-copy-drop migration (add model_name, size_label, color columns; add UNIQUE constraint; remove session_id FK)

**Migration guard**: `SELECT model_name FROM cutting_parts LIMIT 1` — if fails, run migration.

```sql
CREATE TABLE cutting_parts (
  id         TEXT    PRIMARY KEY,
  model_name TEXT    NOT NULL,
  size_label TEXT    NOT NULL DEFAULT '',
  color      TEXT    NOT NULL DEFAULT '',
  part_name  TEXT    NOT NULL,
  count      INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(model_name, size_label, color, part_name)
)
```

**Purpose**: Cumulative inventory per (model, size, color, part). UPSERTED on every cutting session create. Count increases monotonically; does NOT decrease on distribution (distribution_batch_parts tracks distributed quantities separately).

**Indexes**:
- `idx_cutting_parts_model ON cutting_parts(model_name)`
- `idx_cutting_parts_combo ON cutting_parts(model_name, size_label, color, part_name)`

**Migration data**: Old rows had `session_id` — join with `cutting_sessions` to get `model_name` and `fabric_color` for the new `color` field; `size_label` defaults to `''` for legacy.

---

### 4. `distribution_batches` — Use existing `size_label` and `color` columns (already nullable)

No schema change needed. `size_label` and `color` are already nullable TEXT columns. Distribution now populates them from the user's selection.

---

## Entity Relationships

```
cutting_sessions (1) ──→ (N) cutting_session_parts   [per-session log]
cutting_sessions (1) ──→ (N) cutting_consumption_entries

cutting_parts   aggregate: (model_name, size_label, color, part_name) → count
                           UPSERTED from cutting_session_parts on session create

distribution_batches (1) ──→ (N) distribution_batch_parts   [parts breakdown]
distribution_batches (1) ──→ (N) return_records

cutting_parts ←── inventory source for distribution_batch_parts quantities
```

---

## Key Invariants

1. `cutting_parts.count` always equals the sum of all `cutting_session_parts.count` for the same (model, size, color, part_name) combination.
2. `available(model, size, color, part) = cutting_parts.count − net_distributed` where `net_distributed = Σ(dbp.quantity × (1 − batch_return_ratio))`.
3. `cutting_sessions.fabric_color` = `cutting_parts.color` for all parts in that session.
4. `cutting_sessions.size_label` = `cutting_parts.size_label` for all parts in that session.

---

## Lookup Tables (unchanged)

| Table | Purpose | Used in |
|-------|---------|---------|
| `models` | Model names | Cutting form (model dropdown), distribution form |
| `parts` | Part names | Cutting form (part dropdown) |
| `sizes` | Size labels | Cutting form (size dropdown), distribution form |
| `colors` | Color names | Distribution form (color dropdown), parts inventory filter |
