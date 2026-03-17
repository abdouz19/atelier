# Data Model: Stock Management

**Branch**: `002-stock-management` | **Date**: 2026-03-14

## Tables

---

### `stock_items`

Represents a distinct material in the workshop (e.g., "قماش أبيض", "خيط أسود").

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | text | PRIMARY KEY | UUID v4 generated in service layer |
| `name` | text | NOT NULL | Item name (free text, Arabic) |
| `type` | text | NOT NULL | Material category (free text, e.g., قماش, خيط) |
| `unit` | text | NOT NULL | Unit of measure (free text, e.g., متر, كغ) |
| `color` | text | nullable | Item-level color label (free text, optional cosmetic label) |
| `image_path` | text | nullable | Filename of uploaded image in userData/stock-images/ |
| `description` | text | nullable | Short description shown in table row |
| `notes` | text | nullable | Longer operational notes |
| `is_archived` | integer | NOT NULL, DEFAULT 0 | 0 = active, 1 = archived (soft delete) |
| `created_at` | integer | NOT NULL | Unix timestamp ms (auto) |
| `updated_at` | integer | NOT NULL | Unix timestamp ms (auto-updated) |

**Indexes**:
- `idx_stock_items_is_archived` on `(is_archived)` — all list queries filter by this
- `idx_stock_items_type` on `(type)` — type filter and distinct-types query
- `idx_stock_items_name` on `(name)` — name search (LIKE)

**Validation rules** (enforced in service layer):
- `name`: non-empty string, trimmed
- `type`: non-empty string, trimmed
- `unit`: non-empty string, trimmed
- `image_path`: if set, file must exist in userData/stock-images/
- Initial quantity (from creation form): must be a positive number > 0

---

### `stock_transactions`

Every quantity movement for a stock item — both inbound (user-created) and consumed (created by other modules).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | text | PRIMARY KEY | UUID v4 |
| `stock_item_id` | text | NOT NULL, FK → stock_items.id | Parent item |
| `type` | text | NOT NULL | `'inbound'` or `'consumed'` |
| `quantity` | real | NOT NULL, CHECK > 0 | Always a positive number |
| `color` | text | nullable | Color variant label for this transaction |
| `transaction_date` | integer | NOT NULL | Business date (Unix timestamp ms, user-specified) |
| `notes` | text | nullable | Optional note on inbound transactions |
| `source_module` | text | nullable | For consumed: `'cutting'`, `'distribution'`, `'qc'`, `'finition'` |
| `source_reference_id` | text | nullable | ID in the source module for traceability |
| `created_at` | integer | NOT NULL | Audit: when the row was inserted |
| `updated_at` | integer | NOT NULL | Audit: last update timestamp |

**Indexes**:
- `idx_stock_transactions_item_id` on `(stock_item_id)` — all per-item queries
- `idx_stock_transactions_item_color` on `(stock_item_id, color)` — variant computation
- `idx_stock_transactions_date` on `(stock_item_id, transaction_date DESC)` — history ordering

**Validation rules**:
- `type`: must be `'inbound'` or `'consumed'`
- `quantity`: must be > 0 (CHECK constraint + service validation)
- `transaction_date`: must be ≤ today (no future transactions allowed)
- `source_module`: required when `type = 'consumed'`; must be null when `type = 'inbound'`
- Inbound transactions: `source_module` and `source_reference_id` must be null
- Only `quantity` and `transaction_date` are editable after creation (and only for `type = 'inbound'`)

---

## Computed Concepts

### Total Quantity (per item)

```
total = SUM(quantity WHERE type='inbound') - SUM(quantity WHERE type='consumed')
        for all transactions WHERE stock_item_id = ?
```

### Variant Quantity (per color)

```
variant_qty(color) = SUM(quantity WHERE type='inbound' AND color = ?)
                   - SUM(quantity WHERE type='consumed' AND color = ?)
                   for all transactions WHERE stock_item_id = ?
```

- Transactions with `color IS NULL` form the **default (uncolored) variant**.
- If all transactions are uncolored, the item has exactly one default variant.
- If any transaction has a color, each distinct color value forms its own variant.

### Color Variants List (per item)

```
SELECT color,
       SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END) AS qty
FROM stock_transactions
WHERE stock_item_id = ?
GROUP BY color
ORDER BY color NULLS LAST
```

---

## Entity Relationships

```
stock_items (1) ──────── (N) stock_transactions
                              ├── type: 'inbound'   (created by this feature)
                              └── type: 'consumed'  (created by cutting/distribution/qc/finition)
```

---

## State Transitions

### Stock Item Lifecycle

```
[Created] ──── archive ───→ [Archived]
    ↑                            │
    └────── restore ─────────────┘
```

- No hard delete — items can only move between Active and Archived.
- Archiving/restoring does not affect transactions.

### Inbound Transaction Lifecycle

```
[Created] ──── edit (qty + date) ───→ [Updated]
```

- Only `quantity` and `transaction_date` are mutable after creation.
- Consumed transactions are immutable in this feature.

---

## Drizzle Schema Sketch

> Canonical source of truth is the schema files; this is a design reference.

### `electron/db/schema/stock_item.ts`

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const stockItems = sqliteTable('stock_items', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  type:        text('type').notNull(),
  unit:        text('unit').notNull(),
  color:       text('color'),
  imagePath:   text('image_path'),
  description: text('description'),
  notes:       text('notes'),
  isArchived:  integer('is_archived').notNull().default(0),
  createdAt:   integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt:   integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})
```

### `electron/db/schema/stock_transaction.ts`

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { stockItems } from './stock_item'

export const stockTransactions = sqliteTable('stock_transactions', {
  id:                text('id').primaryKey(),
  stockItemId:       text('stock_item_id').notNull().references(() => stockItems.id),
  type:              text('type').notNull(),           // 'inbound' | 'consumed'
  quantity:          real('quantity').notNull(),
  color:             text('color'),
  transactionDate:   integer('transaction_date', { mode: 'timestamp_ms' }).notNull(),
  notes:             text('notes'),
  sourceModule:      text('source_module'),            // null for inbound
  sourceReferenceId: text('source_reference_id'),
  createdAt:         integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt:         integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})
```
