# Data Model: Cutting Session Management

**Branch**: `005-cutting-sessions` | **Date**: 2026-03-15

---

## New Tables

### cutting_sessions

Represents one completed cutting run.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | UUID |
| fabric_item_id | TEXT | NOT NULL, FK → stock_items(id) | Must be type = 'قماش' |
| fabric_color | TEXT | NOT NULL | Color variant of the selected fabric |
| model_name | TEXT | NOT NULL | Free text; used for autocomplete |
| meters_used | REAL | NOT NULL, CHECK > 0 | Deducted from fabric stock |
| layers | INTEGER | NOT NULL, CHECK > 0 | Number of layers cut |
| price_per_layer | REAL | NOT NULL, CHECK > 0 | Cost per layer per employee |
| session_date | INTEGER | NOT NULL | Epoch ms |
| notes | TEXT | | Optional |
| created_at | INTEGER | NOT NULL | Epoch ms |
| updated_at | INTEGER | NOT NULL | Epoch ms |

**Indexes**:
- `idx_cutting_sessions_date` ON cutting_sessions(session_date)
- `idx_cutting_sessions_fabric` ON cutting_sessions(fabric_item_id)

---

### cutting_pieces

One row per individual piece produced by a cutting session.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | UUID |
| session_id | TEXT | NOT NULL, FK → cutting_sessions(id) | |
| size_label | TEXT | NOT NULL | e.g. "S", "M", "42" |
| status | TEXT | NOT NULL, DEFAULT 'not_distributed' | 'not_distributed' \| 'distributed' |
| created_at | INTEGER | NOT NULL | Epoch ms |
| updated_at | INTEGER | NOT NULL | Epoch ms |

**Indexes**:
- `idx_cutting_pieces_session` ON cutting_pieces(session_id)
- `idx_cutting_pieces_status` ON cutting_pieces(status)

**State transitions**: `not_distributed` → `distributed` (managed by future distribution module only; cutting module only creates pieces with `not_distributed`).

---

### cutting_consumption_entries

Non-fabric stock items consumed during a cutting session.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | UUID |
| session_id | TEXT | NOT NULL, FK → cutting_sessions(id) | |
| stock_item_id | TEXT | NOT NULL, FK → stock_items(id) | type ≠ 'قماش' |
| color | TEXT | | NULL if item has no color variants |
| quantity | REAL | NOT NULL, CHECK > 0 | |
| created_at | INTEGER | NOT NULL | Epoch ms |
| updated_at | INTEGER | NOT NULL | Epoch ms |

**Indexes**:
- `idx_cutting_consumption_session` ON cutting_consumption_entries(session_id)

---

## Existing Tables Used (No Schema Changes)

### stock_transactions (existing)

Fabric deduction and non-fabric deductions are written here on session creation.

- `type` = `'consumed'`
- `source_module` = `'cutting'`
- `source_reference_id` = cutting session id
- `quantity` = meters_used (fabric) or consumption quantity (non-fabric)
- `color` = fabric_color or consumption entry color

### employee_operations (existing)

One record per selected employee per session.

- `operation_type` = `'cutting'`
- `source_module` = `'cutting'`
- `source_reference_id` = cutting session id
- `quantity` = layers (informational)
- `price_per_unit` = price_per_layer
- `total_amount` = layers × price_per_layer

---

## Migration SQL

```sql
CREATE TABLE IF NOT EXISTS cutting_sessions (
  id TEXT PRIMARY KEY,
  fabric_item_id TEXT NOT NULL REFERENCES stock_items(id),
  fabric_color TEXT NOT NULL,
  model_name TEXT NOT NULL,
  meters_used REAL NOT NULL CHECK (meters_used > 0),
  layers INTEGER NOT NULL CHECK (layers > 0),
  price_per_layer REAL NOT NULL CHECK (price_per_layer > 0),
  session_date INTEGER NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cutting_sessions_date ON cutting_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_cutting_sessions_fabric ON cutting_sessions(fabric_item_id);

CREATE TABLE IF NOT EXISTS cutting_pieces (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES cutting_sessions(id),
  size_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_distributed',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cutting_pieces_session ON cutting_pieces(session_id);
CREATE INDEX IF NOT EXISTS idx_cutting_pieces_status ON cutting_pieces(status);

CREATE TABLE IF NOT EXISTS cutting_consumption_entries (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES cutting_sessions(id),
  stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
  color TEXT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cutting_consumption_session ON cutting_consumption_entries(session_id);
```
