# Tasks: Piece Distribution Management

**Input**: Design documents from `/specs/006-piece-distribution/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ipc-channels.md ✓, quickstart.md ✓

**Organization**: Tasks grouped by user story. No tests requested — implementation tasks only.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US5)
- Exact file paths in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory scaffolding required by all downstream tasks.

- [X] T001 Create frontend module directories: `frontend/features/tailors/`, `frontend/features/distribution/`, `frontend/components/tailors/`, `frontend/components/distribution/`, `frontend/hooks/` (if absent), `frontend/app/(dashboard)/tailors/`, `frontend/app/(dashboard)/distribution/`
- [X] T002 Create Drizzle schema directory entries: `electron/db/schema/tailor.ts`, `electron/db/schema/tailor_payment.ts`, `electron/db/schema/distribution_batch.ts`, `electron/db/schema/distribution_piece_link.ts`, `electron/db/schema/return_record.ts`, `electron/db/schema/return_consumption_entry.ts` (stub files — actual schema content written in T004–T009)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend migrations, preload bridge, TypeScript types, and IPC client additions. Nothing in Phase 3+ can work without this.

**⚠️ CRITICAL**: Complete this phase fully before starting any user story phase.

- [X] T003 Add DB migration SQL for all 6 new tables in `electron/main.js` inside the existing migration block (see `specs/006-piece-distribution/data-model.md` § Migration SQL): `tailors`, `tailor_payments`, `distribution_batches`, `distribution_piece_links`, `return_records`, `return_consumption_entries` — plus all 11 indexes
- [X] T004 [P] Write Drizzle reference schema `electron/db/schema/tailor.ts`: columns id, name, phone, notes, status DEFAULT 'active', created_at, updated_at
- [X] T005 [P] Write Drizzle reference schema `electron/db/schema/tailor_payment.ts`: columns id, tailor_id (FK tailors), amount, payment_date, notes, created_at, updated_at
- [X] T006 [P] Write Drizzle reference schema `electron/db/schema/distribution_batch.ts`: columns id, tailor_id (FK tailors), model_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at
- [X] T007 [P] Write Drizzle reference schema `electron/db/schema/distribution_piece_link.ts`: columns id, batch_id (FK distribution_batches), piece_id (FK cutting_pieces), created_at
- [X] T008 [P] Write Drizzle reference schema `electron/db/schema/return_record.ts`: columns id, batch_id (FK distribution_batches), quantity_returned, return_date, created_at, updated_at
- [X] T009 [P] Write Drizzle reference schema `electron/db/schema/return_consumption_entry.ts`: columns id, return_id (FK return_records), stock_item_id (FK stock_items), color nullable, quantity, created_at, updated_at
- [X] T010 Add `tailors` namespace (8 channels) and `distribution` namespace (10 channels) to `electron/preload.js` — expose via `contextBridge.exposeInMainWorld('ipcBridge', ...)` matching existing pattern for `employees` and `cutting` namespaces
- [X] T011 [P] Create `frontend/features/tailors/tailors.types.ts`: export `TailorSummary`, `TailorDetail`, `CreateTailorPayload`, `UpdateTailorPayload`, `AddTailorPaymentPayload`, `UpdateTailorPaymentPayload` — types per `contracts/ipc-channels.md`
- [X] T012 [P] Create `frontend/features/distribution/distribution.types.ts`: export `DistributionKpis`, `DistributionTailorSummary`, `DistributionTailorDetail`, `DistributionBatchRow`, `DistributionBatchOption`, `DistributePayload`, `ReturnPayload` — types per `contracts/ipc-channels.md`
- [X] T013 Add `tailors` namespace (8 methods) and `distribution` namespace (10 methods) to `frontend/lib/ipc-client.ts` — follow existing pattern for `employees` and `cutting` namespaces; import types from tailors.types.ts and distribution.types.ts
- [X] T014 Update `frontend/features/auth/auth.types.ts` (or wherever `Window.ipcBridge` is declared): add `tailors` and `distribution` namespace signatures matching the preload bridge additions in T010

**Checkpoint**: Run `npm run build` (or `node --check electron/main.js` + `tsc --noEmit` in frontend) to confirm no compile errors before proceeding.

---

## Phase 3: User Story 1 — Manage Tailors (Priority: P1) 🎯 MVP

**Goal**: Full CRUD for tailors with balance tracking and payment history. Tailors sidebar section works end-to-end.

**Independent Test**: Quickstart Steps 1–7 pass (create, edit, payment CRUD, deactivate/reactivate).

- [X] T015 [US1] Add `tailors:getAll` IPC handler to `electron/main.js`: query all tailors with `totalEarned = SUM(distribution_batches.total_cost)`, `totalPaid = SUM(tailor_payments.amount)`, `balanceDue = totalEarned - totalPaid` (LEFT JOINs); return `TailorSummary[]`
- [X] T016 [US1] Add `tailors:getById` IPC handler to `electron/main.js`: same balance fields plus `sewingTransactions` (array from distribution_batches) and `payments` array from tailor_payments; return `TailorDetail`
- [X] T017 [US1] Add `tailors:create` IPC handler to `electron/main.js`: INSERT into tailors with `crypto.randomUUID()`, `Date.now()` timestamps, status='active'; return `TailorSummary` via `buildTailorSummary(id)`
- [X] T018 [US1] Add `tailors:update` IPC handler to `electron/main.js`: UPDATE tailors SET (name, phone, notes, updated_at) WHERE id; return `TailorSummary`
- [X] T019 [US1] Add `tailors:setStatus` IPC handler to `electron/main.js`: UPDATE tailors SET status=?, updated_at=? WHERE id; return null
- [X] T020 [US1] Add `tailors:addPayment` IPC handler to `electron/main.js`: INSERT into tailor_payments; return `TailorDetail` via `buildTailorDetail(tailorId)`
- [X] T021 [US1] Add `tailors:updatePayment` IPC handler to `electron/main.js`: UPDATE tailor_payments SET (amount, payment_date, notes, updated_at) WHERE id; return `TailorDetail`
- [X] T022 [US1] Add `tailors:deletePayment` IPC handler to `electron/main.js`: DELETE FROM tailor_payments WHERE id; return `TailorDetail`
- [X] T023 [US1] Create `frontend/hooks/useTailorsList.ts`: call `ipcClient.tailors.getAll()`, return `{ tailors, isLoading, error, refetch }`
- [X] T024 [US1] Create `frontend/hooks/useTailorDetail.ts`: accept `id: string | null`, call `ipcClient.tailors.getById({ id })` when id is set, return `{ tailor, isLoading, error, refetch }`
- [X] T025 [P] [US1] Create `frontend/components/tailors/TailorRow.tsx`: named export; single row rendering TailorSummary (name, phone, status badge, totalEarned, balanceDue); `dir="rtl"`; click handler prop; ≤150 lines
- [X] T026 [P] [US1] Create `frontend/components/tailors/NewTailorModal.tsx`: named export; react-hook-form + Zod; fields: name (required), phone (optional), notes (optional); on submit calls `ipcClient.tailors.create`; success toast + refetch; `dir="rtl"`; ≤150 lines
- [X] T027 [P] [US1] Create `frontend/components/tailors/EditTailorModal.tsx`: named export; pre-filled from `TailorSummary`; fields: name, phone, notes; on submit calls `ipcClient.tailors.update`; success toast + refetch; `dir="rtl"`; ≤150 lines
- [X] T028 [P] [US1] Create `frontend/components/tailors/TailorPaymentModal.tsx`: named export; react-hook-form + Zod; fields: amount (>0), paymentDate, notes; supports add (`tailors:addPayment`) and edit (`tailors:updatePayment`) mode; success toast + refetch; ≤150 lines
- [X] T029 [US1] Create `frontend/components/tailors/TailorTable.tsx`: named export; renders `TailorRow` list with search input; EmptyState when empty; Skeleton while loading; ErrorAlert on error; `dir="rtl"`; ≤150 lines
- [X] T030 [US1] Create `frontend/components/tailors/TailorDetail.tsx`: named export; shows tailor profile + balance summary + sewingTransactions table (read-only) + payments list with edit/delete per row (ConfirmDialog on delete); calls `tailors:setStatus` for toggle; `dir="rtl"`; ≤150 lines
- [X] T031 [US1] Create `frontend/app/(dashboard)/tailors/page.tsx`: named export; uses `useTailorsList` + `useTailorDetail`; `?id=` query param switches between list and detail view; "New Tailor" button opens `NewTailorModal`; `dir="rtl"`
- [X] T032 [US1] Add Tailors link to sidebar navigation (in the existing sidebar component) between Employees and the next section

**Checkpoint**: Run app, navigate to Tailors. Quickstart Steps 1–7 must pass.

---

## Phase 4: User Story 2 — View Distribution Overview (Priority: P2)

**Goal**: Distribution screen with 6 KPI cards and per-tailor summary table. Tailor detail view (read-only history).

**Independent Test**: Quickstart Steps 8–10 pass (empty state, KPIs, per-tailor table, detail view).

- [X] T033 [US2] Add `distribution:getKpis` IPC handler to `electron/main.js`: single query returning `piecesInDistribution`, `piecesReturned`, `piecesNotYetReturned` (= piecesInDistribution), `tailorsWithActiveDist`, `totalSewingCost`, `totalUnsettledCost` — see plan.md § KPI Query
- [X] T034 [US2] Add `distribution:getSummary` IPC handler to `electron/main.js`: per-tailor aggregation joining `distribution_batches`, `distribution_piece_links`, `cutting_pieces`, `tailor_payments`; sorted by `piecesInDistribution DESC`; return `DistributionTailorSummary[]`
- [X] T035 [US2] Add `distribution:getDetailByTailor` IPC handler to `electron/main.js`: full batch list with nested returns and consumption entries for one tailor; return `DistributionTailorDetail` — for each batch compute `remainingQuantity = quantity - SUM(return_records.quantity_returned)`
- [X] T036 [US2] Create `frontend/hooks/useDistributionList.ts`: calls `distribution:getKpis` and `distribution:getSummary` in parallel; return `{ kpis, summary, isLoading, error, refetch }`
- [X] T037 [US2] Create `frontend/hooks/useDistributionDetail.ts`: accepts `tailorId: string | null`; calls `distribution:getDetailByTailor` when set; return `{ detail, isLoading, error, refetch }`
- [X] T038 [P] [US2] Create `frontend/components/distribution/DistributionKpiCards.tsx`: named export; renders 6 KPI cards in a row (piecesInDistribution, piecesReturned, piecesNotYetReturned, tailorsWithActiveDist, totalSewingCost, totalUnsettledCost); Skeleton while loading; `dir="rtl"`; ≤150 lines
- [X] T039 [P] [US2] Create `frontend/components/distribution/DistributionSummaryRow.tsx`: named export; single row with tailorName, piecesInDistribution, piecesReturned, piecesNotYetReturned, totalEarned, remainingBalance; click handler prop; `dir="rtl"`; ≤150 lines
- [X] T040 [US2] Create `frontend/components/distribution/DistributionSummaryTable.tsx`: named export; renders `DistributionSummaryRow` list; EmptyState when empty; Skeleton while loading; ErrorAlert on error; `dir="rtl"`; ≤150 lines
- [X] T041 [US2] Create `frontend/components/distribution/DistributionTailorDetail.tsx`: named export; read-only detail view showing all batches with their return records and consumption entries; no edit/delete controls anywhere; `dir="rtl"`; ≤150 lines
- [X] T042 [US2] Create `frontend/app/(dashboard)/distribution/page.tsx`: named export; uses `useDistributionList` + `useDistributionDetail`; `?tailorId=` query param switches between summary and detail; "Distribute" and "Return" buttons visible (wire actions in Phase 5/6); `dir="rtl"`
- [X] T043 [US2] Add Distribution link to sidebar navigation (alongside Tailors link added in T032)

**Checkpoint**: Run app, navigate to Distribution. Quickstart Steps 8–10 must pass (KPIs show zeros, empty summary table, detail view is read-only).

---

## Phase 5: User Story 3 — Distribute Pieces to a Tailor (Priority: P3)

**Goal**: Distribute modal with cascading fields, live availability counter, and atomic distribution action.

**Independent Test**: Quickstart Steps 11–15 pass (modal UX, availability counter, quantity validation, successful submission, autocomplete).

- [X] T044 [US3] Add `distribution:getActiveTailors` IPC handler to `electron/main.js`: SELECT id, name FROM tailors WHERE status='active' ORDER BY name; return `Array<{ id, name }>`
- [X] T045 [US3] Add `distribution:getAvailablePieces` IPC handler to `electron/main.js`: COUNT(*) from cutting_pieces JOIN cutting_sessions WHERE model_name=? AND size_label=? AND fabric_color=? AND status='not_distributed'; return `{ available: number }`
- [X] T046 [US3] Add `distribution:getModelSuggestions` IPC handler to `electron/main.js`: SELECT DISTINCT model_name FROM cutting_sessions ORDER BY model_name; return `string[]`
- [X] T047 [US3] Add `distribution:getSizeSuggestions` IPC handler to `electron/main.js`: SELECT DISTINCT size_label FROM cutting_pieces ORDER BY size_label; return `string[]`
- [X] T048 [US3] Add `distribution:distribute` IPC handler to `electron/main.js`: atomic `db.transaction(...)` — validate tailor active + available pieces ≥ quantity; INSERT distribution_batches; SELECT N piece IDs LIMIT quantity; INSERT distribution_piece_links (one per piece); UPDATE cutting_pieces SET status='distributed'; return `DistributionTailorSummary` — see plan.md § Atomic Distribute
- [X] T049 [US3] Create `frontend/hooks/useDistributeForm.ts`: manages cascading field state (tailorId → modelName → sizeLabel → color); calls `distribution:getModelSuggestions`, `distribution:getSizeSuggestions`, `distribution:getAvailablePieces` (debounced on model+size+color change); exposes `available` count; integrates with react-hook-form + Zod (max quantity = available)
- [X] T050 [US3] Create `frontend/components/distribution/DistributeModal.tsx`: named export; uses `useDistributeForm`; fields: tailor selector (searchable, active only), model (with suggestions), size (with suggestions), color, quantity (max=available, live counter shown), sewingPricePerPiece, totalCost (read-only = qty × price), distributionDate; on submit calls `distribution:distribute`; success toast + refetch; `dir="rtl"`; ≤150 lines
- [X] T051 [US3] Wire "Distribute" button in `frontend/app/(dashboard)/distribution/page.tsx` to open `DistributeModal` and pass refetch callback

**Checkpoint**: Run app. Quickstart Steps 11–15 must pass (availability counter works, quantity capped, submission changes piece statuses, tailor balance updates).

---

## Phase 6: User Story 4 — Return Pieces from a Tailor (Priority: P4)

**Goal**: Return modal with batch selection, partial return support, and optional stock consumption.

**Independent Test**: Quickstart Steps 16–21 pass (batch list, partial return, consumption deduction, validation).

- [X] T052 [US4] Add `distribution:getBatchesForTailor` IPC handler to `electron/main.js`: SELECT batches for tailorId WHERE remaining > 0 (remaining = quantity - COALESCE(SUM(return_records.quantity_returned),0)); return `DistributionBatchOption[]` — see plan.md § Remaining Quantity query
- [X] T053 [US4] Add `distribution:return` IPC handler to `electron/main.js`: atomic `db.transaction(...)` — validate remaining ≥ quantityReturned; validate each consumption entry ≤ available stock; INSERT return_records; SELECT N distributed piece IDs LIMIT quantityReturned; UPDATE cutting_pieces SET status='returned'; for each consumption: INSERT return_consumption_entries + INSERT stock_transactions (type='consumed', source_module='distribution', source_reference_id=returnId); return `DistributionTailorSummary` — see plan.md § Atomic Return
- [X] T054 [US4] Create `frontend/components/distribution/ReturnConsumptionEditor.tsx`: named export; repeatable non-fabric stock consumption rows (searchable item selector, color variant if applicable, quantity with available stock shown, add/remove row); same pattern as cutting module's consumption editor; `dir="rtl"`; ≤150 lines
- [X] T055 [US4] Create `frontend/components/distribution/ReturnModal.tsx`: named export; step 1: tailor selector (active only); step 2: batch list (only batches with remaining > 0, each row shows model/size/color/qty/date, user selects one); step 3: quantityReturned field (default = remainingQuantity, min=1), optional `ReturnConsumptionEditor`, returnDate; on submit calls `distribution:return`; success toast + refetch; `dir="rtl"`; ≤150 lines
- [X] T056 [US4] Wire "Return" button in `frontend/app/(dashboard)/distribution/page.tsx` to open `ReturnModal` and pass refetch callback

**Checkpoint**: Run app. Quickstart Steps 16–21 must pass (partial returns supported, stock deducted, validation blocks over-returns and over-consumption).

---

## Phase 7: User Story 5 — Record Immutability (Priority: P5)

**Goal**: Confirm no edit/delete controls exist on distribution batches or return records anywhere in the UI.

**Independent Test**: Quickstart Steps 22–24 pass (no edit/delete on batches or returns, data persists after restart).

- [X] T057 [US5] Audit `frontend/components/distribution/DistributionTailorDetail.tsx`: confirm zero edit buttons, zero delete buttons, zero form inputs on batch rows and return rows — fix any that exist; all data display-only
- [X] T058 [US5] Audit `electron/main.js`: confirm there are NO `ipcMain.handle` registrations for `distribution:updateBatch`, `distribution:deleteBatch`, `distribution:updateReturn`, `distribution:deleteReturn`, `distribution:updateConsumptionEntry`, `distribution:deleteConsumptionEntry` — document absence as intentional in a code comment block

**Checkpoint**: Quickstart Steps 22–24 pass.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final quality sweep across all new code.

- [X] T059 [P] RTL audit: open each new component file and verify `dir="rtl"` is present on the outermost container div — fix any missing instances across all 13 new component/page files
- [X] T060 [P] 150-line audit: count lines in each of the 13 new component files; split any that exceed 150 lines by extracting sub-components
- [X] T061 TypeScript check: run `tsc --noEmit` in `frontend/`; fix all type errors in new files (tailors.types.ts, distribution.types.ts, ipc-client.ts additions, all hooks and components)
- [ ] T062 Run Quickstart Steps 1–26 end-to-end in the running Electron app; record any failures and fix them; mark this task complete only when all 26 steps pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks all user story phases
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 2 completion (can start in parallel with Phase 3 if needed)
- **Phase 5 (US3)**: Depends on Phase 3 (needs tailors:getAll + active tailor concept) + Phase 2
- **Phase 6 (US4)**: Depends on Phase 5 (needs distribution:distribute + batches) + Phase 3
- **Phase 7 (US5)**: Depends on Phases 4 + 6
- **Phase 8 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (Tailors CRUD)**: Fully independent after Phase 2
- **US2 (Distribution Overview)**: Independent after Phase 2; displays data created by US3/US4 but UI works with empty data
- **US3 (Distribute)**: Requires US1 tailor entity (tailors table + active tailors query)
- **US4 (Return)**: Requires US3 (distribution batches must exist to return from)
- **US5 (Immutability)**: Requires US2 (detail view) and US4 (return records visible)

### Parallel Opportunities Within Each Phase

- **Phase 2**: T004–T009 (Drizzle schemas) and T011–T012 (TypeScript types) can all run in parallel; T003 (migrations) and T010 (preload) can run in parallel with each other
- **Phase 3**: T015–T022 (IPC handlers) sequential within main.js; T025–T028 (modal components) parallel; T023–T024 (hooks) parallel
- **Phase 4**: T033–T035 (handlers) sequential within main.js; T038–T039 (components) parallel
- **Phase 8**: T059–T060 parallel

---

## Parallel Example: Phase 2

```text
# Run these together (different files):
Task T004: electron/db/schema/tailor.ts
Task T005: electron/db/schema/tailor_payment.ts
Task T006: electron/db/schema/distribution_batch.ts
Task T007: electron/db/schema/distribution_piece_link.ts
Task T008: electron/db/schema/return_record.ts
Task T009: electron/db/schema/return_consumption_entry.ts
Task T011: frontend/features/tailors/tailors.types.ts
Task T012: frontend/features/distribution/distribution.types.ts

# Then sequentially (both touch shared files):
Task T003: electron/main.js (migration SQL)
Task T010: electron/preload.js (namespace bridge)
Task T013: frontend/lib/ipc-client.ts (namespace methods)
Task T014: frontend/features/auth/auth.types.ts (Window.ipcBridge)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phase 1: Setup (T001–T002)
2. Phase 2: Foundational (T003–T014)
3. Phase 3: US1 Tailors (T015–T032)
4. **STOP and VALIDATE**: Quickstart Steps 1–7 independently
5. Tailors module is fully functional — demo ready

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 → Tailors MVP (steps 1–7)
3. Phase 4 → Distribution overview + read-only history (steps 8–10)
4. Phase 5 → Distribute action live (steps 11–15)
5. Phase 6 → Return action live (steps 16–21)
6. Phase 7 → Immutability verified (steps 22–24)
7. Phase 8 → Full quickstart 26 steps pass

---

## Summary

| Phase | Tasks | User Story | Parallelizable |
|-------|-------|------------|----------------|
| 1 Setup | T001–T002 | — | No |
| 2 Foundational | T003–T014 | — | T004–T009, T011–T012 |
| 3 US1 Tailors | T015–T032 | US1 (P1) | T023–T028 |
| 4 US2 Overview | T033–T043 | US2 (P2) | T038–T039 |
| 5 US3 Distribute | T044–T051 | US3 (P3) | No |
| 6 US4 Return | T052–T056 | US4 (P4) | No |
| 7 US5 Immutability | T057–T058 | US5 (P5) | No |
| 8 Polish | T059–T062 | — | T059–T060 |

**Total**: 62 tasks across 8 phases
**MVP scope**: Phases 1–3 (T001–T032) — Tailors module complete and independently functional
