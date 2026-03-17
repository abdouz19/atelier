# Data Model: Final Stock Screen

**Feature**: 010-final-stock-screen | **Phase**: 1 | **Date**: 2026-03-17

## Entities

### FinalStockEntry (existing table, extended)

Represents a single immutable addition event to final stock.

**Table**: `final_stock_entries`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PRIMARY KEY | UUID |
| `model_name` | TEXT | NOT NULL | Stored name string |
| `part_name` | TEXT | nullable | NEW — null = "no part" bucket; named part = specific part |
| `size_label` | TEXT | NOT NULL | Stored label string |
| `color` | TEXT | NOT NULL | Stored color string |
| `quantity` | INTEGER | NOT NULL, CHECK > 0 | Pieces added in this event |
| `source_type` | TEXT | NOT NULL | `'finition'` or `'finition_step'` |
| `source_id` | TEXT | NOT NULL | References `finition_records.id` or `finition_steps.id` |
| `entry_date` | INTEGER | NOT NULL | Timestamp (ms) of the addition event |
| `created_at` | INTEGER | NOT NULL | Row creation timestamp |
| `updated_at` | INTEGER | NOT NULL | Row update timestamp |

**Indexes**:
- `idx_final_stock_model` on `(model_name, size_label, color)`
- `idx_final_stock_source` on `(source_type, source_id)`

**Invariants**:
- Records are never hard-deleted (FR-013)
- `quantity` is always positive; all mutations come from the finition flow only
- `part_name = NULL` and `part_name = 'some value'` are distinct identity buckets — never merged

---

### FinalStockRow (derived / read model)

A grouped aggregate computed by the backend query. Not persisted.

| Field | Type | Source |
|-------|------|--------|
| `modelName` | string | `GROUP BY model_name` |
| `partName` | string \| null | `GROUP BY part_name` |
| `sizeLabel` | string | `GROUP BY size_label` |
| `color` | string | `GROUP BY color` |
| `currentQuantity` | number | `SUM(quantity)` |
| `lastUpdatedDate` | number | `MAX(entry_date)` |

**Key identity rule**: Two rows are the same bucket if and only if all four fields (`modelName`, `partName`, `sizeLabel`, `color`) match exactly — NULL part_name is only equal to another NULL, never to any named part.

---

### FinalStockHistoryEntry (derived / read model)

A single entry from `final_stock_entries` for a specific model+part+size+color key. Not persisted.

| Field | Type | Source |
|-------|------|--------|
| `id` | string | `final_stock_entries.id` |
| `sourceType` | `'finition' \| 'finition_step'` | `final_stock_entries.source_type` |
| `sourceId` | string | `final_stock_entries.source_id` |
| `quantityAdded` | number | `final_stock_entries.quantity` |
| `entryDate` | number | `final_stock_entries.entry_date` |

---

### ManagedLookup (existing)

Models, sizes, and colors from the managed lookup lists. Used to populate the filter dropdowns.

| Table | Used for | IPC Channel |
|-------|----------|-------------|
| `models` | Model filter dropdown | `lookups:getModels` |
| `sizes` | Size filter dropdown | `lookups:getSizes` |
| `colors` | Color filter dropdown | `lookups:getColors` |

Filter dropdowns show only active (non-soft-deleted) lookup items. Rows in `final_stock_entries` that reference a now-soft-deleted model/size/color remain visible using the stored name string (per spec assumption).
