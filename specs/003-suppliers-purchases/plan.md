# Implementation Plan: Suppliers & Purchase Tracking

**Branch**: `003-suppliers-purchases` | **Date**: 2026-03-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-suppliers-purchases/spec.md`

---

## Summary

Add a Suppliers module with full CRUD and a per-supplier purchase history view. Extend the existing inbound stock transaction flow to capture supplier, price per unit, and total price paid — stored on the transaction record. The `stock_transactions` table gains four new nullable columns via `ALTER TABLE`. A new `suppliers` table is introduced. All existing stock IPC channels (`stock:create`, `stock:addInbound`, `stock:updateTransaction`) have their payloads extended with optional supplier/price fields. Five new `suppliers:*` IPC channels are added.

---

## Technical Context

**Language/Version**: TypeScript 5 (frontend) + Node.js / plain JavaScript (Electron main process)
**Primary Dependencies**: Next.js 16 (App Router, `output: export`), Electron 41, better-sqlite3, react-hook-form, Zod, Tailwind CSS
**Storage**: SQLite via better-sqlite3 (plain JS in `electron/main.js` — Drizzle TypeScript schemas exist as reference but are not executed at runtime)
**Testing**: Manual via quickstart.md walkthrough
**Target Platform**: macOS desktop (Electron), served via `file://` in production
**Project Type**: Desktop app (Electron + Next.js static export)
**Performance Goals**: Supplier list loads in < 500ms; supplier detail with history loads in < 2s
**Constraints**: `output: 'export'` prohibits dynamic route params — use `?id=` query param pattern for detail views (established by stock feature); no dynamic routes
**Scale/Scope**: Single-user desktop app; supplier count expected < 200; transaction history per supplier < 10,000 rows

---

## Constitution Check

| Gate | Status | Notes |
|---|---|---|
| Core Data Flow (Page → Hook → ipc-client → preload → main.js → handler → DB) | ✅ PASS | Follows established pattern |
| Component max 150 lines, named exports, no inline styles | ✅ PASS | Will enforce in implementation |
| TypeScript strict, no `any`, Zod on all forms | ✅ PASS | Will enforce |
| RTL (`dir="rtl"`) on all new UI | ✅ PASS | |
| EmptyState on every list | ✅ PASS | Suppliers table + purchase history list |
| ConfirmDialog for soft-delete | ✅ PASS | Delete supplier is destructive |
| Toast on success | ✅ PASS | Create/edit/delete supplier |
| ErrorAlert for IPC errors | ✅ PASS | |
| useSearchParams for detail navigation | ✅ PASS | `/suppliers?id=xxx` pattern |
| **Pre-existing divergences (not new violations)** | | |
| Drizzle ORM in queries | ⚠ N/A | main.js uses raw SQLite (established in 001/002) |
| Strings externalized to locales JSON | ⚠ N/A | Hardcoded Arabic in JSX (established in 002) |
| AppLayout / PageHeader components | ⚠ N/A | Not present in project (established in 002) |
| No `useEffect` for data fetching | ⚠ N/A | Hooks use useCallback+useEffect (established in 002) |

---

## Project Structure

### Documentation (this feature)

```text
specs/003-suppliers-purchases/
├── plan.md              ← this file
├── research.md          ← Phase 0 ✅
├── data-model.md        ← Phase 1 ✅
├── quickstart.md        ← Phase 1 ✅
├── contracts/
│   └── ipc-channels.md  ← Phase 1 ✅
└── tasks.md             ← Phase 2 (next: /speckit.tasks)
```

### Source Code

```text
── electron/
│   ├── main.js                          MODIFY: add suppliers table DDL, ALTER TABLE for stock_transactions,
│   │                                            register suppliers:* handlers, extend stock:* handlers
│   └── preload.js                       MODIFY: add suppliers namespace

── frontend/
│   ├── features/
│   │   ├── stock/
│   │   │   └── stock.types.ts           MODIFY: extend StockTransaction, AddInboundPayload,
│   │   │                                        UpdateTransactionPayload, CreateStockItemPayload
│   │   └── suppliers/
│   │       └── suppliers.types.ts       NEW: SupplierSummary, SupplierDetail, PurchaseRecord,
│   │                                         CreateSupplierPayload, UpdateSupplierPayload
│   ├── lib/
│   │   └── ipc-client.ts                MODIFY: add suppliers namespace with 5 typed methods;
│   │                                            extend stock.* method signatures
│   ├── hooks/
│   │   ├── useSupplierList.ts           NEW: fetches suppliers:getAll
│   │   └── useSupplierDetail.ts         NEW: fetches suppliers:getById by id param
│   ├── components/
│   │   ├── suppliers/
│   │   │   ├── SupplierTable.tsx        NEW: table of suppliers with search
│   │   │   ├── SupplierTableRow.tsx     NEW: row with edit/delete actions
│   │   │   ├── AddSupplierModal.tsx     NEW: create form
│   │   │   ├── EditSupplierModal.tsx    NEW: edit form (pre-filled)
│   │   │   └── SupplierDetailPanel.tsx  NEW: profile + purchase history
│   │   ├── stock/
│   │   │   ├── AddInboundModal.tsx      MODIFY: add supplier select + conditional price fields
│   │   │   ├── EditTransactionModal.tsx MODIFY: add supplier select + price fields
│   │   │   ├── AddItemModal.tsx         MODIFY: add optional supplier select + price fields
│   │   │   └── TransactionHistory.tsx   MODIFY: add supplier name + price columns
│   │   └── layout/
│   │       └── Sidebar.tsx              MODIFY: add "الموردون" nav item
│   └── app/(dashboard)/
│       └── suppliers/
│           └── page.tsx                 NEW: suppliers page (list + detail via ?id= param)
```

**Structure Decision**: Follows the established feature-per-directory pattern from stock management. New `frontend/features/suppliers/` for types. New `frontend/components/suppliers/` for UI components. New `app/(dashboard)/suppliers/page.tsx` as the single route handling both list and detail views via `?id=` query param.

---

## Key Implementation Details

### DB Migration Strategy (main.js)

```javascript
// In initDB(), after existing table creation:

// 1. New suppliers table
db.exec(`CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  products_sold TEXT,
  notes TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);`);

// 2. Extend stock_transactions (idempotent via try/catch)
for (const col of [
  'supplier_id TEXT REFERENCES suppliers(id)',
  'supplier_name TEXT',
  'price_per_unit REAL',
  'total_price_paid REAL',
]) {
  try {
    db.exec(`ALTER TABLE stock_transactions ADD COLUMN ${col}`);
  } catch (_) { /* column already exists */ }
}
db.exec(`CREATE INDEX IF NOT EXISTS idx_stock_tx_supplier ON stock_transactions(supplier_id)`);
```

### Supplier Selector in Forms

All three forms (AddInboundModal, EditTransactionModal, AddItemModal) receive a `suppliers` prop of type `SupplierSummary[]` pre-fetched by the parent. The selector is a native `<select>`:

```tsx
<select ...>
  <option value="">-- بدون مورد --</option>
  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
</select>
```

When a supplier is selected, price per unit and total price paid fields appear. When deselected, they hide and their values clear.

### Price Auto-calculation

In `AddInboundModal` and `AddItemModal`, watch `quantity` and `pricePerUnit` with `react-hook-form`'s `watch()`. When either changes and `totalPricePaid` has not been manually overridden, auto-set `totalPricePaid = quantity × pricePerUnit`. Track override with a `boolean` state flag — any manual edit to `totalPricePaid` sets the flag; changing quantity or price resets it.

### Supplier Name Snapshot

In `stock:create`, `stock:addInbound`, and `stock:updateTransaction` handlers in `main.js`: when `supplierId` is provided, look up the supplier name and store it in `supplier_name` on the transaction. This preserves the name even after soft-delete.

### Supplier Detail Navigation

`/suppliers?id=xxx` — same pattern as `/stock?id=xxx`. The suppliers page reads `searchParams.get('id')` and conditionally renders `SupplierDetailPanel` or `SupplierTable`.

### `useSupplierList` hook

Fetches `suppliers:getAll` on mount. Exposes `suppliers: SupplierSummary[]`, `loading`, `error`, `refetch`.

### `useSupplierDetail` hook

Takes `id: string`. Fetches `suppliers:getById`. Exposes `supplier: SupplierDetail | null`, `loading`, `error`, `refetch`.

---

## Complexity Tracking

No constitution violations introduced. All patterns follow the established architecture from stock management (002).
