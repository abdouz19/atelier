# Tasks: Stock Management

**Input**: Design documents from `/specs/002-stock-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/ipc-channels.md ✅, research.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story (US1–US6) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US6)
- No test tasks — not requested in spec

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the file skeleton and locale file needed across all stock phases.

- [x] T001 Create `frontend/public/locales/ar/stock.json` with empty object skeleton (strings added per phase)
- [x] T002 Create directory `electron/features/stock/` and `frontend/features/stock/` and `frontend/components/stock/`

**Checkpoint**: Directory structure in place — foundational phase can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schemas, queries, service, IPC handler, types, and bridge extensions that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T00 Create `electron/db/schema/stock_item.ts` — `stockItems` table (id, name, type, unit, color, image_path, description, notes, is_archived, created_at, updated_at) per data-model.md
- [x] T00 [P] Create `electron/db/schema/stock_transaction.ts` — `stockTransactions` table (id, stock_item_id FK, type, quantity CHECK >0, color, transaction_date, notes, source_module, source_reference_id, created_at, updated_at) per data-model.md
- [x] T00 Register `stockItems` and `stockTransactions` tables in `electron/db/index.ts` so they are created on app startup alongside existing tables
- [x] T00 Create `electron/features/stock/stock.queries.ts` — implement: `getAllActiveItems`, `getArchivedItems`, `getItemById` (with variant aggregation and transaction history), `getDistinctTypes`, `getDistinctUnits`, `insertStockItem`, `insertTransaction`, `updateStockItem`, `updateTransaction`, `setArchived` — all using Drizzle ORM, no raw SQL
- [x] T00 Create `electron/features/stock/stock.service.ts` — implement: `createItem` (validate + insert item + insert initial inbound transaction + save image file to `userData/stock-images/`), `updateItem` (validate + update metadata + handle image replace/remove), `addInbound` (validate date ≤ today + quantity > 0 + insert transaction), `updateTransaction` (guard type='inbound' + validate + update), `archiveItem`, `restoreItem`, `getAll`, `getArchived`, `getById`, `getTypes`, `getUnits`
- [x] T00 Create `electron/ipc/stock.handler.ts` — register all 10 channels: `stock:getAll`, `stock:getArchived`, `stock:getById`, `stock:getTypes`, `stock:getUnits`, `stock:create`, `stock:update`, `stock:addInbound`, `stock:updateTransaction`, `stock:archive`, `stock:restore` — each calls corresponding service method, returns `{ success: true, data }` or `{ success: false, error }`
- [x] T00 Register stock handler in `electron/main/index.ts` (alongside existing auth and user handler registrations)
- [x] T01 Extend `electron/preload/index.ts` — add `stock` namespace to `ipcBridge` with all 10 channel wrappers per `contracts/ipc-channels.md`; update `Window` global TypeScript interface
- [x] T01 Extend `frontend/lib/ipc-client.ts` — add `stock` namespace with all 10 typed methods per `contracts/ipc-channels.md`
- [x] T01 Create `frontend/features/stock/stock.types.ts` — define: `StockItemSummary`, `StockItemDetail`, `ColorVariant`, `StockTransaction`, `CreateStockItemPayload`, `UpdateStockItemPayload`, `AddInboundPayload`, `UpdateTransactionPayload` per `contracts/ipc-channels.md`
- [x] T01 Create `frontend/store/useStockStore.ts` — Zustand store with: `searchQuery: string`, `typeFilter: string | null`, `setSearchQuery`, `setTypeFilter` (UI state only; DB data stays in hooks)

**Checkpoint**: All 10 IPC channels wired end-to-end. Verify by launching the app and calling `stock:getAll` from devtools — should return `{ success: true, data: [] }`.

---

## Phase 3: User Story 1 — Browse and Search Stock Items (Priority: P1) 🎯 MVP

**Goal**: Users can open the stock screen, see all active items in a table, search by name, filter by type, and see red flags on low-quantity items.

**Independent Test**: Seed 5 stock items (2 with zero quantity, 2 different types) via DB. Open `/stock`. Verify: table renders all 5 rows; search filters correctly; type filter narrows results; zero-quantity rows shown in red; empty state appears when filter matches nothing.

- [x] T01 [US1] Create `frontend/hooks/useStockList.ts` — calls `stock:getAll` on mount via `ipcClient`; exposes `items: StockItemSummary[]`, `loading: boolean`, `error: string | null`, `refetch: () => void`; also calls `stock:getTypes` for filter options
- [x] T01 [P] [US1] Create `frontend/components/stock/StockTableRow.tsx` — renders one row: name, type, quantity+unit (red if `isLow`), color indicator (single-color badge) or variant count badge (multi-color), image thumbnail, description; emits `onAddInbound`, `onArchive`, `onRowClick` callbacks; max 150 lines
- [x] T01 [P] [US1] Create `frontend/components/stock/StockTable.tsx` — renders search input (bound to `useStockStore.searchQuery`), type filter dropdown, `StockTableRow` list, `EmptyState` when no results; uses `useSearchParams` to persist search + filter in URL; max 150 lines
- [x] T01 [US1] Create `frontend/app/(dashboard)/stock/page.tsx` — uses `AppLayout`, `PageHeader` ("المخزون"), `useStockList`, `useStockStore`; renders `StockTable`; add Arabic strings to `stock.json`: page title, search placeholder, type filter label, empty state message
- [x] T01 [US1] Add stock route to `frontend/components/layout/Sidebar.tsx` — add "المخزون" nav item pointing to `/stock` using a relevant Lucide icon

**Checkpoint**: US1 fully functional — users can browse and search the stock list.

---

## Phase 4: User Story 2 — Add a New Stock Item (Priority: P2)

**Goal**: Users can open "Add Item" modal, fill in all fields, submit, and see the new item appear in the list with its initial inbound transaction recorded.

**Independent Test**: Click "Add Item". Fill name="قماش أبيض", type="قماش", unit="متر", quantity=50, color="أبيض". Submit. Verify item appears in table with quantity 50. Verify duplicate-name warning appears when entering the same name again (but submission is not blocked).

- [x] T01 [US2] Create `frontend/components/stock/AddItemModal.tsx` — `react-hook-form` + Zod schema (name required, type required, unit required, initialQuantity > 0 required, color/image/description/notes optional); type and unit fields show datalist suggestions from `stock:getTypes` / `stock:getUnits`; image upload input with client-side format/size validation; duplicate-name non-blocking warning inline; calls `ipcClient.stock.create` on submit; toast on success; max 150 lines
- [x] T02 [US2] Wire `AddItemModal` into `frontend/app/(dashboard)/stock/page.tsx` — add "إضافة صنف" button in `PageHeader`; open modal on click; call `refetch` from `useStockList` on success; add Arabic strings to `stock.json`: button label, modal title, field labels, validation messages, success toast
- [x] T02 [US2] Add image save/delete logic to `electron/features/stock/stock.service.ts` — `saveImage(base64, mimeType): string` saves file to `userData/stock-images/{uuid}.{ext}` and returns filename; `deleteImage(filename)` removes file; called from `createItem` and `updateItem`

**Checkpoint**: US2 fully functional — users can add new items with images.

---

## Phase 5: User Story 3 — Record Incoming Stock (Priority: P3)

**Goal**: Users can add incoming quantity from the table row or detail view; transaction is dated correctly (defaults to today, can be backdated); color pre-fills if item has one variant; quantity and date of inbound transactions can be edited.

**Independent Test**: Select "قماش أبيض" (quantity 50). Add incoming: quantity=30, backdate to yesterday. Verify quantity becomes 80 and transaction appears in history with yesterday's date. Open edit on the inbound transaction, change quantity to 20. Verify total becomes 70.

- [x] T02 [US3] Create `frontend/hooks/useStockMutations.ts` — exposes typed async functions: `addInbound(payload)`, `updateTransaction(payload)`, `archiveItem(id)`, `restoreItem(id)`, `updateItem(payload)` — each calls the corresponding `ipcClient.stock.*` method and returns the `IpcResponse`
- [x] T02 [US3] Create `frontend/components/stock/AddInboundModal.tsx` — `react-hook-form` + Zod (quantity > 0 required, date required defaults to today, color optional pre-filled from item if single variant, notes optional); calls `useStockMutations.addInbound`; toast on success; add Arabic strings to `stock.json`
- [x] T02 [US3] Create `frontend/components/stock/EditTransactionModal.tsx` — `react-hook-form` + Zod (quantity > 0 required, date ≤ today required); only shown for `type='inbound'` transactions; calls `useStockMutations.updateTransaction`; toast on success; add Arabic strings to `stock.json`
- [x] T02 [US3] Wire `AddInboundModal` into `frontend/components/stock/StockTableRow.tsx` — trigger from row-level "إضافة وارد" action button; pass item data for color pre-fill; call `refetch` on success

**Checkpoint**: US3 fully functional — incoming stock is logged and editable.

---

## Phase 6: User Story 4 — View Item Detail with Variants and History (Priority: P4)

**Goal**: Clicking a table row opens the item detail page showing all attributes, color variant cards with computed quantities (red if low), and a full chronological transaction history with read-only consumed entries.

**Independent Test**: Open "قماش أبيض" detail. Verify: top section shows name/type/unit/description/notes. Variant cards appear (one per color used in transactions). Each card shows correct computed quantity. Transaction history shows all inbound + consumed entries in date order. Consumed rows have no edit controls.

- [x] T02 [US4] Create `frontend/hooks/useStockItem.ts` — takes `id: string`; calls `stock:getById`; exposes `item: StockItemDetail | null`, `loading`, `error`, `refetch`
- [x] T02 [P] [US4] Create `frontend/components/stock/ColorVariantCard.tsx` — renders color label (or "بدون لون" for null), computed quantity+unit, red badge if `isLow`; max 150 lines
- [x] T02 [P] [US4] Create `frontend/components/stock/TransactionHistory.tsx` — renders sorted transaction list; each row: date (formatted Arabic), type badge (وارد/مستهلك), quantity+color, source module label for consumed; consumed rows render no action buttons; inbound rows render edit button that opens `EditTransactionModal`; max 150 lines
- [x] T02 [US4] Create `frontend/components/stock/ItemDetailPanel.tsx` — top section: image, name, type, unit, description, notes, "تعديل" button; variant cards grid using `ColorVariantCard`; `TransactionHistory` below; "إضافة وارد" button opens `AddInboundModal`; max 150 lines
- [x] T03 [US4] Create `frontend/app/(dashboard)/stock/[id]/page.tsx` — uses `AppLayout`, `PageHeader` with item name, `useStockItem(id)`; renders skeleton loader while loading; renders `ErrorAlert` on error; renders `ItemDetailPanel` on success; add Arabic strings to `stock.json`: section labels, variant labels, history column headers, source module names

**Checkpoint**: US4 fully functional — item detail with variants and history is accessible.

---

## Phase 7: User Story 5 — Edit Item Metadata (Priority: P5)

**Goal**: Users can edit name, type, unit, color, image, description, and notes from the detail view. Quantity field is absent from the form.

**Independent Test**: Open "قماش أبيض" detail. Click "تعديل". Change name to "قماش أبيض 120g". Upload a new image. Save. Verify updated name appears in list and detail. Verify no quantity input was present in the form.

- [x] T03 [US5] Create `frontend/components/stock/EditItemModal.tsx` — `react-hook-form` + Zod; fields: name, type, unit, color, image (with current image preview + clear option), description, notes; NO quantity field; calls `useStockMutations.updateItem`; duplicate-name warning (same as AddItemModal); toast on success; add Arabic strings to `stock.json`
- [x] T03 [US5] Wire `EditItemModal` into `frontend/components/stock/ItemDetailPanel.tsx` — open on "تعديل" button click; call `refetch` from `useStockItem` on success; also call `useStockList.refetch` (passed as prop or via Zustand) to sync the list

**Checkpoint**: US5 fully functional — item metadata editable from detail view.

---

## Phase 8: User Story 6 — Archive and Restore Items (Priority: P6)

**Goal**: Users can archive items (disappear from main list), view archived items in a separate view, and restore any archived item.

**Independent Test**: Archive "قماش أبيض". Verify it disappears from main stock list. Navigate to archived view. Verify it appears there. Click "استعادة" and confirm. Verify it reappears in main list with full history intact.

- [x] T03 [US6] Create `frontend/components/stock/ArchivedItemsView.tsx` — table of archived `StockItemSummary` items; each row has "استعادة" button that opens `ConfirmDialog`; on confirm calls `useStockMutations.restoreItem` then `refetch`; `EmptyState` when no archived items; add Arabic strings to `stock.json`: section title, empty state, confirm dialog title/body, restore button
- [x] T03 [US6] Add archive action to `frontend/components/stock/StockTableRow.tsx` — "أرشفة" row action triggers `ConfirmDialog`; on confirm calls `useStockMutations.archiveItem` then `refetch`; add archive confirmation strings to `stock.json`
- [x] T03 [US6] Integrate `ArchivedItemsView` into `frontend/app/(dashboard)/stock/page.tsx` — add tab or toggle ("نشط" / "مؤرشف") to switch between active list and archived view; wire `useStockList` to also expose archived items via `stock:getArchived`; add tab label strings to `stock.json`

**Checkpoint**: US6 fully functional — full archive/restore lifecycle works.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, consistency, and final verification.

- [x] T036 Audit `frontend/public/locales/ar/stock.json` — ensure every string used across all stock components is present; remove any hardcoded Arabic strings remaining in JSX
- [x] T037 [P] Add skeleton loaders to `frontend/app/(dashboard)/stock/page.tsx` and `frontend/app/(dashboard)/stock/[id]/page.tsx` per constitution (loading state for table and detail)
- [x] T038 [P] Verify `useSearchParams` usage in `StockTable.tsx` correctly persists `searchQuery` and `typeFilter` in URL across navigation
- [x] T039 Verify `ConfirmDialog` is used for all destructive actions (archive) per constitution; verify `ErrorAlert` is used for all IPC errors in hooks
- [ ] T040 Run `quickstart.md` end-to-end walkthrough: create item → add inbound → view detail → edit metadata → archive → restore; fix any gaps found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3–8 (User Stories)**: All depend on Phase 2 completion; can proceed in priority order (P1 → P6) or in parallel with multiple developers
- **Phase 9 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Depends On | Notes |
|---|---|---|
| US1 (Browse) | Phase 2 | No story dependencies — pure read path |
| US2 (Add Item) | Phase 2 + US1 list page | Adds "Add Item" button to list page |
| US3 (Incoming) | Phase 2 + US1 | Adds action to table rows; independently testable |
| US4 (Detail) | Phase 2 + US1 | New page, independent of US2/US3 modals |
| US5 (Edit) | Phase 2 + US4 | Edit button lives in detail panel |
| US6 (Archive) | Phase 2 + US1 | Archive action on table rows; restore in separate view |

### Within Each User Story

- Electron-side tasks (queries, service, handler) → Frontend hooks → Components → Page wiring
- [P] tasks within a phase can be started in parallel

### Parallel Opportunities

- T003 and T004 (both schemas): parallel
- T015 and T016 (both components): parallel
- T027 and T028 (variant card and transaction history): parallel
- T037 and T038 (skeleton loaders and URL params): parallel
- US1 table components (T015, T016): parallel

---

## Parallel Example: Phase 2 (Foundational)

```
# Start schema files together:
Task T003: electron/db/schema/stock_item.ts
Task T004: electron/db/schema/stock_transaction.ts

# After T003+T004 done, start together:
Task T006: stock.queries.ts
Task T012: stock.types.ts  (frontend — no electron dependency)
Task T013: useStockStore.ts (frontend — no electron dependency)
```

## Parallel Example: Phase 6 (User Story 4)

```
# Start these together after T026 (useStockItem) is done:
Task T027: ColorVariantCard.tsx
Task T028: TransactionHistory.tsx

# Then compose:
Task T029: ItemDetailPanel.tsx (depends on T027 + T028)
Task T030: [id]/page.tsx      (depends on T029)
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1 + Phase 2 (foundational)
2. Complete Phase 3 (US1 — browse & search)
3. **STOP and VALIDATE**: App shows stock list, search works, red flags visible
4. Demo to stakeholders

### Incremental Delivery

```
Phase 2 complete → all IPC channels wired, empty list visible
+ US1 → browse and search stock
+ US2 → add new items
+ US3 → record incoming, edit transactions
+ US4 → full item detail with variants and history
+ US5 → edit item metadata
+ US6 → archive and restore
+ Phase 9 → polish and harden
```

---

## Notes

- `[P]` = different files, no dependency on an incomplete preceding task in the same phase
- `[Story]` label maps each task to a user story for traceability
- All Electron-side logic (T003–T009) can be completed and verified via IPC before any frontend work begins
- Consumed transactions (`source_module` is set) are written by future modules — the stock schema and service must be in place for those modules to reference `stock_items.id`
- Image files accumulate in `userData/stock-images/` — `updateItem` must delete the old file when a new image is uploaded or the image is cleared
