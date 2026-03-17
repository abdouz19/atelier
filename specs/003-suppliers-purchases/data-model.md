# Data Model: Suppliers & Purchase Tracking

## New Table: `suppliers`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `name` | TEXT | NOT NULL | Supplier display name |
| `phone` | TEXT | | Free text, no format validation |
| `address` | TEXT | | Free text |
| `products_sold` | TEXT | | Free text description |
| `notes` | TEXT | | General notes |
| `is_deleted` | INTEGER | NOT NULL DEFAULT 0 | 0 = active, 1 = soft-deleted |
| `created_at` | INTEGER | NOT NULL | Unix ms timestamp |
| `updated_at` | INTEGER | NOT NULL | Unix ms timestamp |

**Indexes**:
- `idx_suppliers_name` ON `suppliers(name)` — for ordered listing and lookup

**Validation Rules**:
- `name` must be non-empty (trimmed length > 0)
- No uniqueness constraint on `name` (duplicates allowed per spec)
- `is_deleted` transitions: 0 → 1 (soft delete); 1 → 0 (restore if needed, not in scope for this feature)

---

## Modified Table: `stock_transactions` (extended)

Four nullable columns added via `ALTER TABLE ADD COLUMN`:

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `supplier_id` | TEXT | REFERENCES suppliers(id) | Nullable; set when supplier selected |
| `supplier_name` | TEXT | | Snapshot of supplier name at transaction time; set alongside `supplier_id` |
| `price_per_unit` | REAL | CHECK (price_per_unit > 0) when not null | Required when `supplier_id` is set |
| `total_price_paid` | REAL | CHECK (total_price_paid > 0) when not null | May differ from `quantity × price_per_unit` (user override) |

**Additional Index**:
- `idx_stock_tx_supplier` ON `stock_transactions(supplier_id)` — for supplier purchase history queries

**Validation Rules**:
- If `supplier_id` is set → `price_per_unit` MUST be set → `supplier_name` MUST be set
- `total_price_paid` defaults to `quantity × price_per_unit` but can be overridden
- If `supplier_id` is null → `price_per_unit` and `total_price_paid` MAY be null
- Only `type = 'inbound'` transactions can have supplier/price data (consumed transactions come from other modules)

**Migration Strategy**:
Existing rows have all four new columns as NULL — fully backwards compatible. New rows from the stock-only flow that omit supplier data will also be NULL in these columns.

---

## Entity Relationships

```
suppliers (1) ──────── (*) stock_transactions
     id ◄──────────── supplier_id (nullable FK)
                       supplier_name (snapshot TEXT)
                       price_per_unit (nullable REAL)
                       total_price_paid (nullable REAL)

stock_items (1) ─────── (*) stock_transactions
     id ◄────────────── stock_item_id (existing FK)
```

---

## Frontend Type Definitions

### New types (`frontend/features/suppliers/suppliers.types.ts`)

```typescript
export interface SupplierSummary {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  productsSold: string | null;
  notes: string | null;
  isDeleted: boolean;
}

export interface PurchaseRecord {
  transactionId: string;
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  unit: string;
  color: string | null;
  pricePerUnit: number;
  totalPricePaid: number;
  transactionDate: number; // Unix ms
}

export interface SupplierDetail extends SupplierSummary {
  totalSpent: number;
  purchases: PurchaseRecord[];
}

export interface CreateSupplierPayload {
  name: string;
  phone?: string;
  address?: string;
  productsSold?: string;
  notes?: string;
}

export interface UpdateSupplierPayload {
  id: string;
  name?: string;
  phone?: string | null;
  address?: string | null;
  productsSold?: string | null;
  notes?: string | null;
}
```

### Extended types (`frontend/features/stock/stock.types.ts` — additions)

```typescript
// StockTransaction extended:
export interface StockTransaction {
  // ... existing fields ...
  supplierName: string | null;   // NEW
  pricePerUnit: number | null;   // NEW
  totalPricePaid: number | null; // NEW
}

// AddInboundPayload extended:
export interface AddInboundPayload {
  // ... existing fields ...
  supplierId?: string;        // NEW
  pricePerUnit?: number;      // NEW
  totalPricePaid?: number;    // NEW
}

// UpdateTransactionPayload extended:
export interface UpdateTransactionPayload {
  // ... existing fields ...
  supplierId?: string | null;      // NEW (null = remove supplier)
  pricePerUnit?: number | null;    // NEW
  totalPricePaid?: number | null;  // NEW
}

// CreateStockItemPayload extended:
export interface CreateStockItemPayload {
  // ... existing fields ...
  supplierId?: string;        // NEW
  pricePerUnit?: number;      // NEW
  totalPricePaid?: number;    // NEW
}
```

---

## Drizzle Sketch (for TypeScript source reference — not used at runtime)

```typescript
// electron/db/schema/supplier.ts
export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  products_sold: text('products_sold'),
  notes: text('notes'),
  is_deleted: integer('is_deleted').notNull().default(0),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});
```
