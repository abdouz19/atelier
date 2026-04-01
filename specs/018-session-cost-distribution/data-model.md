# Data Model: Session Cost Calculation & Part Cost Distribution

**Branch**: `018-session-cost-distribution` | **Date**: 2026-04-01

---

## Modified Tables

### `cutting_sessions` — 4 new cost columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `fabric_cost` | REAL | YES (NULL for old sessions → display as 0) | Sum of (meters × price_per_unit) across all fabric batch consumptions |
| `employee_cost` | REAL | YES | layers × price_per_layer × employee_count |
| `consumed_materials_cost` | REAL | YES | Sum of (quantity × price_per_unit) across all material batch consumptions |
| `total_session_cost` | REAL | YES | fabric_cost + employee_cost + consumed_materials_cost |

**Migration**: `ALTER TABLE cutting_sessions ADD COLUMN IF NOT EXISTS fabric_cost REAL` (×4)

**Backward compatibility**: Existing sessions will have NULL for all 4 columns. The UI displays NULL as 0.00 in cost fields and the detail view shows a "cost data unavailable" note.

---

### `cutting_session_parts` — 1 new cost column

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `unit_cost` | REAL | YES | Cost per produced piece for this part+size row, resolved from the cost distribution table on submission |

**Migration**: `ALTER TABLE cutting_session_parts ADD COLUMN IF NOT EXISTS unit_cost REAL`

---

### `cutting_pieces` — 1 new cost column

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `unit_cost` | REAL | YES | Inherited from the corresponding `cutting_session_parts.unit_cost` at creation time |

**Migration**: `ALTER TABLE cutting_pieces ADD COLUMN IF NOT EXISTS unit_cost REAL`

---

## New Table

### `cutting_batch_consumptions`

Records the exact quantity drawn from each specific inbound purchase batch (stock_transactions row with type='inbound') during a cutting session. One row per batch selected, per session.

| Column | Type | Nullable | Constraints |
|--------|------|----------|-------------|
| `id` | TEXT | NO | PRIMARY KEY |
| `session_id` | TEXT | NO | FK → cutting_sessions.id |
| `stock_transaction_id` | TEXT | NO | FK → stock_transactions.id (must be type='inbound') |
| `stock_item_id` | TEXT | NO | FK → stock_items.id (denormalized for query efficiency) |
| `color` | TEXT | YES | Color of the item consumed from this batch (nullable for items with no color) |
| `quantity` | REAL | NO | Meters (fabric) or units (material) consumed from this batch |
| `price_per_unit` | REAL | NO | Snapshot of price_per_unit from the inbound transaction at time of cutting |
| `is_fabric` | INTEGER | NO | 1 = fabric batch, 0 = consumed material batch |
| `created_at` | INTEGER | NO | Timestamp in ms |
| `updated_at` | INTEGER | NO | Timestamp in ms |

**Creation SQL**:
```sql
CREATE TABLE IF NOT EXISTS cutting_batch_consumptions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  stock_transaction_id TEXT NOT NULL,
  stock_item_id TEXT NOT NULL,
  color TEXT,
  quantity REAL NOT NULL,
  price_per_unit REAL NOT NULL,
  is_fabric INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
```

---

## Available Quantity Query Pattern

To compute available quantity for a specific inbound batch (used in `cutting:getFabricBatches` and `cutting:getMaterialBatches`):

```sql
SELECT
  st.id AS transaction_id,
  st.transaction_date,
  st.price_per_unit,
  st.quantity AS original_quantity,
  (st.quantity - COALESCE(SUM(cbc.quantity), 0)) AS available_quantity
FROM stock_transactions st
LEFT JOIN cutting_batch_consumptions cbc ON cbc.stock_transaction_id = st.id
WHERE st.stock_item_id = ? AND st.color = ? AND st.type = 'inbound'
GROUP BY st.id
ORDER BY st.transaction_date DESC
```

---

## Entity Relationships (this feature)

```
stock_transactions (inbound)
  └─── cutting_batch_consumptions (many per session, many per batch)
         └─── cutting_sessions
                ├─── cutting_session_parts (unit_cost per row)
                └─── cutting_pieces (unit_cost per piece)
```

---

## Computed Cost Fields (frontend-only, not persisted)

These are computed in component state and sent to the backend on submission:

| Field | Formula |
|-------|---------|
| `fabricCost` | `SUM(batch.quantity × batch.pricePerUnit)` across fabric batches |
| `employeeCost` | `layers × pricePerLayer × employeeIds.length` |
| `consumedMaterialsCost` | `SUM(batch.quantity × batch.pricePerUnit)` across all material batches |
| `totalSessionCost` | `fabricCost + employeeCost + consumedMaterialsCost` |
| `partRowTotal` | `unitCost × count` per part row |
| `grandTotal` | `SUM(partRowTotal)` across all distribution rows |

---

## Validation Rules

| Rule | Where Enforced |
|------|---------------|
| Batch quantity entered ≤ batch available quantity | Frontend (inline, red field) + Backend (pre-insert check) |
| All fabric batch quantities ≥ 0 | Frontend |
| At least 1 fabric batch with quantity > 0 must be selected | Frontend + Backend |
| Grand total of cost distribution = totalSessionCost (when not all-locked mismatch) | Frontend (blocks submit button) |
| If all rows locked and grand total ≠ totalSessionCost → block submit | Frontend |
| All cost values stored with REAL (2 decimal display via toFixed(2) in UI) | Frontend display |
| `unit_cost` on cutting_session_parts = resolved value from distribution table | Backend on insert |
| `unit_cost` on cutting_pieces = same value as its session_part row | Backend on insert |
