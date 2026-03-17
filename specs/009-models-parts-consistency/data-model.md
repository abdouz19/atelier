# Data Model: Models, Pieces & Platform-Wide Relational Consistency

**Feature**: 009-models-parts-consistency
**Date**: 2026-03-16

---

## New Tables

### `models`

Managed lookup for garment models.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PK | `crypto.randomUUID()` |
| `name` | TEXT | NOT NULL, UNIQUE (case-insensitive) | e.g. "حجاب", "خمار" |
| `is_predefined` | INTEGER | NOT NULL DEFAULT 0 | 1 = seeded, cannot delete |
| `is_active` | INTEGER | NOT NULL DEFAULT 1 | 0 = soft-deleted |
| `created_at` | INTEGER | NOT NULL | epoch ms |
| `updated_at` | INTEGER | NOT NULL | epoch ms |

**Validation**: name trimmed, non-empty, case-insensitive unique among active + inactive entries.
**Soft-delete**: `is_active = 0` hides from selectors; stored name strings in other tables remain intact.

---

### `parts`

Managed lookup for garment parts (pieces of a garment).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PK | `crypto.randomUUID()` |
| `name` | TEXT | NOT NULL, UNIQUE (case-insensitive) | e.g. "الضهر", "الأمام", "الكم" |
| `is_predefined` | INTEGER | NOT NULL DEFAULT 0 | |
| `is_active` | INTEGER | NOT NULL DEFAULT 1 | |
| `created_at` | INTEGER | NOT NULL | epoch ms |
| `updated_at` | INTEGER | NOT NULL | epoch ms |

---

### `sizes`

Managed lookup for garment sizes.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PK | `crypto.randomUUID()` |
| `name` | TEXT | NOT NULL, UNIQUE (case-insensitive) | e.g. "S", "M", "12yo" |
| `is_predefined` | INTEGER | NOT NULL DEFAULT 0 | |
| `is_active` | INTEGER | NOT NULL DEFAULT 1 | |
| `created_at` | INTEGER | NOT NULL | epoch ms |
| `updated_at` | INTEGER | NOT NULL | epoch ms |

---

## Modified Tables (ALTER TABLE — new columns only)

### `cutting_pieces` — add 2 columns

| New Column | Type | Default | Notes |
|------------|------|---------|-------|
| `part_name` | TEXT | NULL | Stored at write time from managed parts list; NULL for pre-feature rows |
| `color` | TEXT | NULL | Inherited from parent `cutting_sessions.fabric_color` at write time; NULL for pre-feature rows |

*Existing columns unchanged*: `id`, `session_id`, `size_label` (still stores the size name string), `status`, `created_at`, `updated_at`

**Migration**: `ALTER TABLE cutting_pieces ADD COLUMN part_name TEXT` + `ALTER TABLE cutting_pieces ADD COLUMN color TEXT` (wrapped in try/catch for idempotency).

---

### `employee_operations` — add 3 columns

| New Column | Type | Default | Notes |
|------------|------|---------|-------|
| `model_name` | TEXT | NULL | Populated for all operation types; NULL for pre-feature rows |
| `part_name` | TEXT | NULL | Populated for cutting operations only; NULL for distribution/QC/finition/custom |
| `color` | TEXT | NULL | Populated for cutting operations; NULL for pre-feature rows |

*Existing columns unchanged*: `id`, `employee_id`, `operation_type`, `source_module`, `source_reference_id`, `operation_date`, `quantity`, `price_per_unit`, `total_amount`, `notes`, `created_at`, `updated_at`

**Migration**: Three `ALTER TABLE employee_operations ADD COLUMN` statements wrapped in try/catch.

---

### `stock_transactions` — add 1 column

| New Column | Type | Default | Notes |
|------------|------|---------|-------|
| `model_name` | TEXT | NULL | Populated for `type = 'consumed'` transactions; NULL for inbound and pre-feature rows |

*Existing columns unchanged*: `id`, `stock_item_id`, `type`, `quantity`, `color`, `transaction_date`, `notes`, `source_module`, `source_reference_id`, `created_at`, `updated_at`

**Migration**: `ALTER TABLE stock_transactions ADD COLUMN model_name TEXT` wrapped in try/catch.

---

## Drizzle Reference Schemas (new files)

New reference-only TypeScript schemas to add to `electron/db/schema/`:

### `model.ts`
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const models = sqliteTable('models', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isPredefined: integer('is_predefined').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```

### `part.ts`
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const parts = sqliteTable('parts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isPredefined: integer('is_predefined').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```

### `size.ts`
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const sizes = sqliteTable('sizes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isPredefined: integer('is_predefined').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```

---

## Entity Relationships

```
models (lookup)
  ← referenced by name in: cutting_sessions.model_name,
                            distribution_batches.model_name,
                            employee_operations.model_name,
                            stock_transactions.model_name,
                            qc_records.model_name (if exists),
                            finition_records.model_name (if exists),
                            final_stock_entries.model_name

parts (lookup)
  ← referenced by name in: cutting_pieces.part_name

sizes (lookup)
  ← referenced by name in: cutting_pieces.size_label,
                            distribution_batches.size_label,
                            final_stock_entries.size_label

cutting_sessions
  └─ cutting_pieces (1:many, session_id FK)
       part_name stored from parts list
       color inherited from cutting_sessions.fabric_color
       size_label stored from sizes list

employee_operations
  model_name stored from models list
  part_name stored from parts list (cutting only)
  source_reference_id → links to source record in respective table

stock_transactions
  model_name stored from models list (consumed transactions only)
  source_reference_id → links to source production record
```

---

## Data Integrity Rules

1. **Unique name**: `models`, `parts`, `sizes` enforce case-insensitive unique names at the service layer (SELECT COUNT check before INSERT/UPDATE). SQLite stores them without a UNIQUE constraint to avoid case-sensitivity issues.
2. **Soft-delete protection**: `is_predefined = 1` entries cannot be deleted or renamed; enforced in service layer.
3. **Inline-add deduplication**: If an inline-add fails due to duplicate name, the error surfaces inline within the dropdown without closing the parent form.
4. **NULL tolerance**: New columns on existing tables accept NULL for backward-compatibility with pre-feature rows.
5. **Historical immutability**: Pre-feature rows with free-text model/size values are not modified by migrations.
