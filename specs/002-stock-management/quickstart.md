# Quickstart: Stock Management

**Branch**: `002-stock-management` | **Date**: 2026-03-14

A developer guide for implementing the stock management feature from scratch.

## Prerequisites

- Auth feature (spec 001) is complete — users are authenticated before reaching any stock screen.
- Development environment running: `npm run dev:electron` from repo root.

## Implementation Order

Follow this order to avoid building on incomplete foundations:

### Step 1 — DB Schema (Electron)

Create `electron/db/schema/stock_item.ts` and `electron/db/schema/stock_transaction.ts` as defined in `data-model.md`. Register both tables in `electron/db/index.ts` so they are created on app startup.

### Step 2 — Queries (Electron)

Create `electron/features/stock/stock.queries.ts` with:
- `getAllActiveItems(db)` — items with computed `totalQuantity` and `variantCount`
- `getArchivedItems(db)` — same for archived
- `getItemById(db, id)` — full item + variants + transactions
- `getDistinctTypes(db)` / `getDistinctUnits(db)` — for autocomplete
- `insertStockItem(db, data)` — creates item row
- `insertTransaction(db, data)` — creates transaction row
- `updateStockItem(db, id, data)` — updates metadata fields
- `updateTransaction(db, id, data)` — updates quantity + date for inbound only
- `setArchived(db, id, value)` — toggles is_archived

### Step 3 — Service (Electron)

Create `electron/features/stock/stock.service.ts` with:
- `createItem(db, payload)` — validates, inserts item + initial inbound transaction, saves image file if provided
- `updateItem(db, payload)` — validates, updates metadata, handles image replacement/removal
- `addInbound(db, payload)` — validates, inserts inbound transaction
- `updateTransaction(db, payload)` — validates type is 'inbound', validates quantity > 0 and date ≤ now, updates
- `archiveItem(db, id)` / `restoreItem(db, id)` — delegates to queries
- All image I/O uses `app.getPath('userData')/stock-images/`

### Step 4 — IPC Handler (Electron)

Create `electron/ipc/stock.handler.ts`. Register all 10 channels from `contracts/ipc-channels.md`. Call the corresponding service method for each channel. Return `{ success: true, data }` or `{ success: false, error: e.message }`.

Register the handler in `electron/main/index.ts` alongside the existing auth and user handlers.

### Step 5 — Preload Bridge + IPC Client (Frontend)

Extend `electron/preload/index.ts` to expose `window.ipcBridge.stock.*` as defined in the contracts file.

Extend `frontend/lib/ipc-client.ts` to add the `stock` namespace.

Update TypeScript global type declarations to include the new bridge methods.

### Step 6 — Types (Frontend)

Create `frontend/features/stock/stock.types.ts` with `StockItemSummary`, `StockItemDetail`, `ColorVariant`, `StockTransaction`, and all payload types from the contracts.

### Step 7 — Hooks (Frontend)

Create the three hooks:
- `useStockList` — calls `stock:getAll`, exposes `items`, `loading`, `error`, and `refetch`
- `useStockItem(id)` — calls `stock:getById`, exposes `item`, `variants`, `transactions`, `loading`, `error`
- `useStockMutations` — exposes typed functions for each write channel, each calling the IPC client and returning the result

### Step 8 — Zustand Store (Frontend)

Create `frontend/store/useStockStore.ts` with: `searchQuery`, `typeFilter`, `setSearchQuery`, `setTypeFilter`. Use `useSearchParams` for URL-based filter persistence.

### Step 9 — Components (Frontend)

Build components in this order (each is independently testable):
1. `StockTableRow` — renders one row; accepts item data as props; flags low quantity in red
2. `StockTable` — renders the full table with search + filter inputs, empty state
3. `AddItemModal` — react-hook-form + Zod; calls `useStockMutations.create`
4. `AddInboundModal` — react-hook-form + Zod; pre-fills color if single variant
5. `ColorVariantCard` — renders one variant card with quantity and red flag if low
6. `TransactionHistory` — renders the chronological list; no edit controls on consumed rows
7. `EditTransactionModal` — edit quantity + date for inbound transactions
8. `ItemDetailPanel` — composes header + variant cards + history
9. `EditItemModal` — metadata-only form
10. `ArchivedItemsView` — table of archived items with restore action (ConfirmDialog)

### Step 10 — Pages (Frontend)

Create `frontend/app/(dashboard)/stock/page.tsx` — uses `AppLayout`, `PageHeader`, `useStockList`, `useStockStore`, renders `StockTable` and modals.

Create `frontend/app/(dashboard)/stock/[id]/page.tsx` — uses `AppLayout`, `PageHeader`, `useStockItem`, renders `ItemDetailPanel` and modals.

Add the stock route to the sidebar navigation in `frontend/components/layout/Sidebar.tsx`.

### Step 11 — Localization (Frontend)

Create `frontend/public/locales/ar/stock.json` with all Arabic strings used in the stock module. Reference strings from all components using the project's i18n mechanism.

## Key Patterns to Follow

Refer to the auth feature as the canonical reference implementation:
- `electron/features/auth/auth.service.ts` → pattern for service methods
- `electron/features/auth/auth.queries.ts` → pattern for Drizzle queries
- `electron/ipc/auth.handler.ts` → pattern for handler registration
- `frontend/hooks/useAuth.ts` → pattern for data hooks
- `frontend/components/auth/LoginForm.tsx` → pattern for react-hook-form + Zod forms

## Gotchas

- **No Drizzle in renderer**: Never import from `electron/` in `frontend/`. All data flows through IPC.
- **Image paths**: The DB stores filename only. The service resolves the full path before returning to the renderer.
- **Quantity check constraint**: SQLite will enforce `quantity > 0` at the DB level; the service should validate first to return a user-friendly error.
- **Consumed transactions are write-protected**: The `stock:updateTransaction` handler must check `type = 'inbound'` and return an error if not.
- **RTL**: All new components inherit RTL from the root layout. No additional `dir` attribute needed on individual elements.
- **useSearchParams for filters**: Search query and type filter should be in the URL so the state survives navigation. See constitution's state management rules.
