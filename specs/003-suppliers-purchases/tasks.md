# Tasks: Suppliers & Purchase Tracking

**Input**: Design documents from `/specs/003-suppliers-purchases/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ipc-channels.md ✅, quickstart.md ✅

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure for new supplier feature

- [X] T001 Create `frontend/features/suppliers/` and `frontend/components/suppliers/` directories (mkdir stubs)
- [X] T002 Create `frontend/app/(dashboard)/suppliers/` page directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend DB schema, IPC bridge, and TypeScript types — MUST be complete before any user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add `suppliers` table DDL and `idx_suppliers_name` index to `initDB()` in `electron/main.js`
- [X] T004 Add `ALTER TABLE stock_transactions ADD COLUMN` calls (try/catch, idempotent) for `supplier_id`, `supplier_name`, `price_per_unit`, `total_price_paid` and `idx_stock_tx_supplier` index in `electron/main.js`
- [X] T005 [P] Add `suppliers` namespace to `electron/preload.js` (getAll, getById, create, update, delete via `ipcRenderer.invoke`)
- [X] T006 [P] Create `frontend/features/suppliers/suppliers.types.ts` with `SupplierSummary`, `SupplierDetail`, `PurchaseRecord`, `CreateSupplierPayload`, `UpdateSupplierPayload`
- [X] T007 [P] Extend `frontend/features/stock/stock.types.ts`: add `supplierName`, `pricePerUnit`, `totalPricePaid` to `StockTransaction`; add `supplierId`, `pricePerUnit`, `totalPricePaid` to `AddInboundPayload`, `UpdateTransactionPayload`, `CreateStockItemPayload`
- [X] T008 Add `suppliers` namespace to `frontend/lib/ipc-client.ts` with 5 typed methods (getAll, getById, create, update, delete); extend `stock.addInbound`, `stock.updateTransaction`, `stock.create` signatures with optional supplier/price fields

**Checkpoint**: DB schema ready, IPC bridge wired, all TypeScript types defined — user story implementation can begin

---

## Phase 3: User Story 1 — Manage Supplier Directory (Priority: P1) 🎯 MVP

**Goal**: Users can view, add, edit, and soft-delete suppliers from a dedicated sidebar section

**Independent Test**: Navigate to الموردون → add two suppliers → edit one → delete the other; verify empty state, table rows, confirmation dialog, and toasts all work correctly (quickstart Steps 1, 2, 8, 9)

### Implementation for User Story 1

- [X] T009 [US1] Register `suppliers:getAll`, `suppliers:create`, `suppliers:update`, `suppliers:delete` IPC handlers in `electron/main.js` (with supplier name lookup for snapshot, UUID generation, is_deleted soft-delete)
- [X] T010 [P] [US1] Create `frontend/hooks/useSupplierList.ts` — fetches `suppliers:getAll`, exposes `suppliers`, `loading`, `error`, `refetch`
- [X] T011 [P] [US1] Create `frontend/components/suppliers/SupplierTableRow.tsx` — row with name, phone, address, productsSold, notes columns and edit/delete action buttons
- [X] T012 [US1] Create `frontend/components/suppliers/AddSupplierModal.tsx` — react-hook-form + Zod; fields: name (required), phone, address, productsSold, notes; calls `ipcClient.suppliers.create`; shows toast on success
- [X] T013 [US1] Create `frontend/components/suppliers/EditSupplierModal.tsx` — same fields pre-filled; calls `ipcClient.suppliers.update`; shows toast on success
- [X] T014 [US1] Create `frontend/components/suppliers/SupplierTable.tsx` — renders `SupplierTableRow` list with EmptyState when empty; includes search/filter input; accepts `suppliers`, `onEdit`, `onDelete`, `onRowClick` props
- [X] T015 [US1] Create `frontend/app/(dashboard)/suppliers/page.tsx` — reads `?id=` search param; when no id: renders `SupplierTable` + `AddSupplierModal` trigger; uses `useSupplierList`; integrates `ConfirmDialog` for delete with soft-delete call; shows `ErrorAlert` on IPC error
- [X] T016 [US1] Add "الموردون" nav item to `frontend/components/layout/Sidebar.tsx` (link to `/suppliers`)

**Checkpoint**: Suppliers list page fully functional — add, edit, delete, empty state, search all work independently

---

## Phase 4: User Story 2 — View Supplier Purchase History (Priority: P2)

**Goal**: Clicking a supplier opens a detail view with their profile and a complete purchase history with total spent

**Independent Test**: Add a supplier, navigate to their detail view — profile info displays correctly; purchase history is empty with EmptyState; after linking transactions (manual DB or via US3), verify history rows and total spent aggregate (quickstart Step 6)

### Implementation for User Story 2

- [X] T017 [US2] Register `suppliers:getById` IPC handler in `electron/main.js` — queries supplier row + LEFT JOIN stock_transactions + stock_items; returns `SupplierDetail` with `purchases[]` and `totalSpent`
- [X] T018 [P] [US2] Create `frontend/hooks/useSupplierDetail.ts` — takes `id: string`; fetches `suppliers:getById`; exposes `supplier`, `loading`, `error`, `refetch`
- [X] T019 [US2] Create `frontend/components/suppliers/SupplierDetailPanel.tsx` — renders supplier profile (name, phone, address, productsSold, notes) + purchase history table with columns: item name, quantity, unit, price/unit, total paid, date; shows total spent summary at top; EmptyState when no purchases; back button calls `onBack` prop
- [X] T020 [US2] Wire `SupplierDetailPanel` into `frontend/app/(dashboard)/suppliers/page.tsx` — when `?id=` param present, render `SupplierDetailPanel` instead of `SupplierTable`; use `useSupplierDetail(id)`; `onBack` calls `router.replace('/suppliers')`

**Checkpoint**: Supplier detail view with purchase history works — navigate to detail, back to list, history displays correctly

---

## Phase 5: User Story 3 — Record Purchase Price on Incoming Stock (Priority: P3)

**Goal**: When adding or editing an inbound transaction, users can optionally select a supplier, enter price per unit, and optionally override the auto-calculated total price paid

**Independent Test**: Open add-inbound modal → select supplier → price fields appear → auto-calculate total → override total → submit; verify transaction shows supplier + prices in history; edit transaction to change supplier retroactively (quickstart Steps 4, 5, 7)

### Implementation for User Story 3

- [X] T021 [US3] Extend `stock:addInbound` handler in `electron/main.js` — accept optional `supplierId`, `pricePerUnit`, `totalPricePaid`; look up and snapshot `supplier_name`; validate price required when supplierId set; default `totalPricePaid = quantity × pricePerUnit` when omitted
- [X] T022 [US3] Extend `stock:updateTransaction` handler in `electron/main.js` — accept optional `supplierId` (null = remove), `pricePerUnit` (null), `totalPricePaid` (null); update snapshot logic; validate price required when supplierId set
- [X] T023 [US3] Extend `stock:getById` handler in `electron/main.js` — include `supplier_name`, `price_per_unit`, `total_price_paid` in transaction rows returned
- [X] T024 [US3] Modify `frontend/components/stock/AddInboundModal.tsx` — add supplier `<select>` (native, pre-fetched list via prop); when supplier selected: show pricePerUnit + totalPricePaid fields; auto-calculate total via `watch('quantity') × watch('pricePerUnit')`; track manual override flag; validate pricePerUnit required when supplier set; extend form submission payload
- [X] T025 [US3] Modify `frontend/components/stock/EditTransactionModal.tsx` — add supplier `<select>` and price fields; same conditional display and validation logic as AddInboundModal; extend submission payload
- [X] T026 [US3] Fetch `useSupplierList` in the stock item detail parent (`frontend/app/(dashboard)/stock/page.tsx` or `ItemDetailPanel`) and pass `suppliers` prop down to `AddInboundModal` and `EditTransactionModal`
- [X] T027 [US3] Modify `frontend/components/stock/TransactionHistory.tsx` — add supplierName, pricePerUnit, totalPricePaid columns to the transaction table; show "—" when null

**Checkpoint**: Purchase price recording fully working — add inbound with supplier+price, edit retroactively, history shows all supplier+price data

---

## Phase 6: User Story 4 — Link Supplier on Stock Item Creation (Priority: P4)

**Goal**: When creating a new stock item, users can optionally select a supplier and enter price for the initial inbound transaction

**Independent Test**: Open add-item modal → select supplier → price fields appear → auto-calculate total → submit; verify item appears in stock list and its initial transaction shows supplier + price (quickstart Step 3)

### Implementation for User Story 4

- [X] T028 [US4] Extend `stock:create` handler in `electron/main.js` — accept optional `supplierId`, `pricePerUnit`, `totalPricePaid` on the initial inbound transaction insert; snapshot supplier_name; validate price required when supplierId set
- [X] T029 [US4] Modify `frontend/components/stock/AddItemModal.tsx` — add optional supplier `<select>` and conditional price fields (same pattern as AddInboundModal); pass `suppliers` prop from parent; extend Zod schema and submission payload; price fields are optional (no supplier = no price required)
- [X] T030 [US4] Fetch `useSupplierList` in `frontend/app/(dashboard)/stock/page.tsx` and pass `suppliers` prop to `AddItemModal`

**Checkpoint**: Full feature complete — all 4 user stories functional end-to-end

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate full integration and confirm quickstart walkthrough passes

- [X] T031 [P] Run TypeScript compiler check (`tsc --noEmit`) across all modified/new files and fix any type errors
- [X] T032 Validate RTL (`dir="rtl"`) present on all new supplier UI components and pages
- [X] T033 Walk through `specs/003-suppliers-purchases/quickstart.md` Steps 1–9 end-to-end and verify all assertions pass
- [X] T034 [P] Review all new components for 150-line limit; split any that exceed it

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2; no dependency on US2/US3/US4
- **US2 (Phase 4)**: Depends on Phase 2; no hard dependency on US1 (but supplier detail page re-uses suppliers/page.tsx from US1)
- **US3 (Phase 5)**: Depends on Phase 2; no dependency on US1/US2/US4
- **US4 (Phase 6)**: Depends on Phase 2 and US3 (shares supplier select pattern; can reuse AddInboundModal supplier prop pattern)
- **Polish (Phase 7)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2
- **US2 (P2)**: Independent after Phase 2; T020 touches suppliers/page.tsx created in US1 (T015) — sequence after T015
- **US3 (P3)**: Independent after Phase 2; T026 touches stock/page.tsx — no conflict with US1/US2
- **US4 (P4)**: Independent after Phase 2; T030 touches stock/page.tsx (same as T026) — sequence T030 after T026

### Parallel Opportunities

- T005, T006, T007 in Phase 2 can run in parallel (different files)
- T010, T011 in Phase 3 can run in parallel
- T017, T018 in Phase 4 can run in parallel
- T031, T034 in Phase 7 can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# These can run simultaneously (different files):
Task T005: "Add suppliers namespace to electron/preload.js"
Task T006: "Create frontend/features/suppliers/suppliers.types.ts"
Task T007: "Extend frontend/features/stock/stock.types.ts"
# T003 and T004 must run sequentially (same file: electron/main.js)
# T008 must run after T006 and T007 (depends on types)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 — Manage Supplier Directory
4. **STOP and VALIDATE**: Can add/edit/delete suppliers; sidebar link works; empty state and toasts work
5. Proceed to Phase 4 (US2) once US1 validated

### Incremental Delivery

1. Setup + Foundational → types, DB, IPC bridge ready
2. US1 → Supplier CRUD with sidebar nav (MVP — standalone value)
3. US2 → Supplier detail + purchase history (adds visibility)
4. US3 → Price recording on inbound transactions (core purchase tracking)
5. US4 → Price on initial stock creation (completes the loop)

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- T003 and T004 both modify `electron/main.js` — run sequentially
- T008 modifies `frontend/lib/ipc-client.ts` — run after T006 and T007
- T015 and T020 both modify `suppliers/page.tsx` — T020 must run after T015
- T026 and T030 both modify `stock/page.tsx` — T030 must run after T026
- Supplier name snapshot (T009, T021, T022, T028): look up `SELECT name FROM suppliers WHERE id = ?` at write time; store in `supplier_name` column regardless of later soft-delete
- Auto-calculate logic (T024, T029): use react-hook-form `watch()` + `useEffect`; track manual override with a `boolean` state flag; reset flag when quantity or pricePerUnit changes
