# Data Model: Stock & Suppliers Enhancements

## New Tables

### `item_types`

Managed lookup list for stock item categories.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PK | `crypto.randomUUID()` |
| name | TEXT | NOT NULL, UNIQUE (LOWER(name)) | Display name, Arabic |
| is_predefined | INTEGER | NOT NULL DEFAULT 0 | 1 = cannot be edited or deleted |
| is_active | INTEGER | NOT NULL DEFAULT 1 | 0 = soft-deleted |
| created_at | INTEGER | NOT NULL | Timestamp ms |
| updated_at | INTEGER | NOT NULL | Timestamp ms |

**Predefined seed entry** (on migration): `{ name: 'قماش', is_predefined: 1, is_active: 1 }`

**Indexes**: `idx_item_types_active ON item_types(is_active)`

---

### `colors`

App-wide managed list of colors used across stock items, cutting sessions, and distribution batches.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PK | `crypto.randomUUID()` |
| name | TEXT | NOT NULL, UNIQUE (LOWER(name)) | Display name, Arabic |
| is_predefined | INTEGER | NOT NULL DEFAULT 0 | 1 = cannot be edited or deleted |
| is_active | INTEGER | NOT NULL DEFAULT 1 | 0 = soft-deleted |
| created_at | INTEGER | NOT NULL | Timestamp ms |
| updated_at | INTEGER | NOT NULL | Timestamp ms |

**Predefined seed entries** (on migration):
`أبيض`, `أسود`, `أحمر`, `أزرق`, `أخضر`, `أصفر`, `رمادي`, `بيج` — all with `is_predefined=1`

**Indexes**: `idx_colors_active ON colors(is_active)`

---

### `units`

Managed lookup list for stock item measurement units.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PK | `crypto.randomUUID()` |
| name | TEXT | NOT NULL, UNIQUE (LOWER(name)) | Display name, Arabic |
| is_predefined | INTEGER | NOT NULL DEFAULT 0 | 1 = cannot be edited or deleted |
| is_active | INTEGER | NOT NULL DEFAULT 1 | 0 = soft-deleted |
| created_at | INTEGER | NOT NULL | Timestamp ms |
| updated_at | INTEGER | NOT NULL | Timestamp ms |

**Predefined seed entry** (on migration): `{ name: 'متر', is_predefined: 1, is_active: 1 }`

**Indexes**: `idx_units_active ON units(is_active)`

---

## Existing Tables (No Schema Change)

The following tables store lookup values as **TEXT name strings** (not foreign keys). No column changes are needed — this is the established pattern.

| Table | Column | Current Type | Behavior After Feature |
|-------|--------|-------------|----------------------|
| `stock_items` | `type` | TEXT NOT NULL | Value string selected from `item_types` |
| `stock_items` | `unit` | TEXT NOT NULL | Value string selected from `units` |
| `stock_items` | `color` | TEXT NULL | Value string selected from `colors` |
| `stock_transactions` | `color` | TEXT NULL | Value string selected from `colors` |
| `cutting_sessions` | `fabric_color` | TEXT NOT NULL | Value string selected from `colors` (intersection with available stock) |
| `distribution_batches` | `color` | TEXT NOT NULL | Value string selected from `colors` |

**Historical integrity**: Soft-deleting a lookup entry does not affect stored strings on any of these rows. The stored name is the canonical value — it is displayed as-is regardless of lookup list state.

---

## Migration Strategy

The migration block in `electron/main.js` creates the three new tables and then seeds them:

### Step 1: Create tables + indexes
```sql
CREATE TABLE IF NOT EXISTS item_types (...);
CREATE TABLE IF NOT EXISTS colors (...);
CREATE TABLE IF NOT EXISTS units (...);
CREATE INDEX IF NOT EXISTS idx_item_types_active ON item_types(is_active);
CREATE INDEX IF NOT EXISTS idx_colors_active ON colors(is_active);
CREATE INDEX IF NOT EXISTS idx_units_active ON units(is_active);
```

### Step 2: Seed predefined entries (idempotent — INSERT OR IGNORE)
```sql
INSERT OR IGNORE INTO item_types (id, name, is_predefined, is_active, created_at, updated_at)
  VALUES (randomUUID, 'قماش', 1, 1, now, now);

INSERT OR IGNORE INTO units (id, name, is_predefined, is_active, created_at, updated_at)
  VALUES (randomUUID, 'متر', 1, 1, now, now);

INSERT OR IGNORE INTO colors (id, name, is_predefined, is_active, created_at, updated_at)
  VALUES (uuid, 'أبيض', 1, 1, ...), (uuid, 'أسود', 1, 1, ...), ...8 rows...;
```

**Note**: The UNIQUE constraint is on `LOWER(name)`, so INSERT OR IGNORE silently skips duplicates even if the same name was already added by a previous migration run or pre-existing data.

### Step 3: Seed existing data as user-created entries (idempotent)
```sql
-- Collect distinct types from existing stock items
INSERT OR IGNORE INTO item_types (id, name, is_predefined, is_active, created_at, updated_at)
  SELECT hex(randomblob(16)), type, 0, 1, unixepoch()*1000, unixepoch()*1000
  FROM (SELECT DISTINCT type FROM stock_items WHERE type IS NOT NULL AND type != '');

-- Collect distinct units from existing stock items
INSERT OR IGNORE INTO units (id, name, is_predefined, is_active, created_at, updated_at)
  SELECT hex(randomblob(16)), unit, 0, 1, unixepoch()*1000, unixepoch()*1000
  FROM (SELECT DISTINCT unit FROM stock_items WHERE unit IS NOT NULL AND unit != '');

-- Collect distinct colors from stock_items, cutting_sessions, distribution_batches
INSERT OR IGNORE INTO colors (id, name, is_predefined, is_active, created_at, updated_at)
  SELECT hex(randomblob(16)), color_val, 0, 1, unixepoch()*1000, unixepoch()*1000
  FROM (
    SELECT color AS color_val FROM stock_items WHERE color IS NOT NULL AND color != ''
    UNION SELECT fabric_color FROM cutting_sessions WHERE fabric_color IS NOT NULL AND fabric_color != ''
    UNION SELECT color FROM distribution_batches WHERE color IS NOT NULL AND color != ''
  );
```

**UNIQUE conflict**: The `INSERT OR IGNORE` on `LOWER(name)` means predefined colors (أبيض etc.) are not duplicated if they already exist as user-created entries from this seed step.

---

## Entity Relationships

```
item_types (lookup)     colors (lookup)         units (lookup)
     │                       │                       │
     │ name string            │ name string            │ name string
     ▼                       ▼                       ▼
stock_items.type    stock_items.color       stock_items.unit
                    stock_transactions.color
                    cutting_sessions.fabric_color
                    distribution_batches.color
```

No FK constraints. Relationship is semantic (by name string matching), not referential.
