# Tasks: Quality Control & Finition

**Input**: Design documents from `/specs/008-qc-finition/`
**Branch**: `008-qc-finition`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to
- Exact file paths are included in every task description

---

## Phase 1: Setup

**Purpose**: Database schema, IPC bridge, and shared type definitions that every story depends on.

- [X] T001 Add 7 new CREATE TABLE blocks (qc_records, qc_consumption_entries, finition_records, finition_consumption_entries, finition_steps, finition_step_consumption_entries, final_stock_entries) with all indexes to `electron/main.js` immediately after the `return_consumption_entries` block
- [X] T002 Add `qc` and `finition` namespaces (channel lists) to `electron/preload.js`
- [X] T003 [P] Create reference-only Drizzle schema `electron/db/schema/qc_record.ts`
- [X] T004 [P] Create reference-only Drizzle schema `electron/db/schema/finition_record.ts`
- [X] T005 [P] Create reference-only Drizzle schema `electron/db/schema/finition_step.ts`
- [X] T006 [P] Create reference-only Drizzle schema `electron/db/schema/final_stock_entry.ts`
- [X] T007 [P] Create `frontend/features/qc/qc.types.ts` — export `ReturnBatchForQc`, `QcRecordSummary`, `CreateQcPayload`, `QcKpis` per contracts/ipc-contracts.md
- [X] T008 [P] Create `frontend/features/finition/finition.types.ts` — export `QcRecordForFinition`, `FinitionRecordSummary`, `CreateFinitionPayload`, `CreateStepPayload`, `AddToFinalStockPayload` per contracts/ipc-contracts.md

**Checkpoint**: DB schema applied, IPC bridge wired, all TypeScript types available

---

## Phase 2: Foundational — QC Backend

**Purpose**: QC query layer, service, IPC handler, and frontend hook. All user stories depend on QC records existing, so this is a hard prerequisite.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T009 Create `electron/features/qc/queries.js` — implement `getReturnBatchesForQc` (return_records joined to distribution_batches + tailors, filtered to unreviewed qty > 0), `getQcRecords` (all records with batch/employee info + derived batchStatus), `getKpis` (all 8 KPI aggregations per data-model.md KPI table)
- [X] T010 Create `electron/features/qc/service.js` — implement `createQcRecord({ returnId, employeeId, quantityReviewed, qtyDamaged, qtyAcceptable, qtyGood, qtyVeryGood, pricePerPiece, reviewDate, consumptionEntries })` with grade-sum validation and atomic insert of qc_records + qc_consumption_entries rows (uuid v4 ids, unix-ms timestamps)
- [X] T011 Create `electron/ipc/qc.handler.js` — register four channels: `qc:getKpis`, `qc:getReturnBatchesForQc`, `qc:getRecords`, `qc:create`; each follows `{success,data}|{success,error}` envelope; call service/queries only
- [X] T012 Add `qc` namespace to `frontend/lib/ipc-client.ts` — typed wrappers for all four channels matching qc.types.ts interfaces
- [X] T013 Create `frontend/hooks/useQcData.ts` — export `useQcData()` returning `{ kpis, returnBatches, qcRecords, loading, error, refetch }`; fetches all three in parallel via `Promise.all`; no JSX

**Checkpoint**: QC backend is functional — `qc:create` can be called end-to-end from the renderer

---

## Phase 3: User Story 1 — Quality Control Review (Priority: P1) 🎯 MVP

**Goal**: Supervisor can create QC records against returned batches, assign grades, and view all QC records in a table with batch status.

**Independent Test**: Open the app, navigate to `/qc`, create a QC record against a return batch, verify grade totals save correctly and unreviewed qty decreases.

- [X] T014 [P] [US1] Create `frontend/components/qc/QcConsumptionEditor.tsx` — controlled list of consumption entry rows (stock item select + color input + quantity input); add/remove row buttons; exposes `value: ConsumptionEntry[]` + `onChange` prop; ≤150 lines
- [X] T015 [P] [US1] Create `frontend/components/qc/QcKpiCards.tsx` — receives `QcKpis` prop; renders 8 stat cards (pendingQc, totalReviewed, totalDamaged, totalAcceptable, totalGood, totalVeryGood, finitionPending, readyForStock) in a responsive grid; ≤150 lines
- [X] T016 [P] [US1] Create `frontend/components/qc/QcTable.tsx` — receives `QcRecordSummary[]`; columns: batch info, date, employee, grade quantities, batchStatus badge (مكتمل/جزئي); empty state; ≤150 lines
- [X] T017 [US1] Create `frontend/components/qc/AddQcRecordModal.tsx` — modal form: return batch select (shows tailor/model/size/color/available qty), quantity reviewed input, four grade quantity inputs with live sum-vs-reviewed validation, price per piece input, auto-calculated total cost (read-only), date picker, `QcConsumptionEditor` section; submits via `ipcClient.qc.create`; ≤150 lines
- [X] T018 [US1] Create `frontend/app/(dashboard)/qc/page.tsx` — QC & Finition screen; renders `QcKpiCards` above tabs; QC tab renders `QcTable` + "+ إضافة مراجعة" button → `AddQcRecordModal`; Finition tab placeholder for US2; uses `useQcData` hook; `dir="rtl"`

**Checkpoint**: US1 fully functional — QC records can be created, listed, and KPIs update correctly

---

## Phase 4: User Story 2 — Finition (Priority: P2)

**Goal**: Worker can create finition records against QC-accepted pieces, mark the product ready, and add it to final stock.

**Independent Test**: Create a finition record against a QC record, answer "yes" to the readiness prompt, fill model/size/color, and verify a final_stock_entry is created and readyForStock KPI increases.

- [X] T019 Create `electron/features/finition/queries.js` — implement `getQcRecordsForFinition` (QC records with finitionableRemaining > 0), `getFinitionRecords` (all finition records with step chain and names joined), `getFinalStockTotal` (sum by model/size/color)
- [X] T020 Create `electron/features/finition/service.js` — implement `createFinitionRecord({ qcId, employeeId, quantity, pricePerPiece, finitionDate, consumptionEntries })` with quantity-vs-finitionableRemaining validation and atomic insert; implement `addToFinalStock({ sourceType, sourceId, modelName, sizeLabel, color, quantity, entryDate })` which inserts final_stock_entries row and sets is_ready=1 on the source record
- [X] T021 Create `electron/ipc/finition.handler.js` — register channels: `finition:getQcRecordsForFinition`, `finition:getRecords`, `finition:create`, `finition:addToFinalStock`; envelope pattern; call service/queries only
- [X] T022 Add `finition` namespace to `frontend/lib/ipc-client.ts` — typed wrappers for all four channels; will be extended with `createStep` in US3
- [X] T023 Create `frontend/hooks/useFinitionData.ts` — export `useFinitionData()` returning `{ qcRecordsForFinition, finitionRecords, loading, error, refetch }`; parallel fetch; no JSX
- [X] T024 [P] [US2] Create `frontend/components/finition/FinitionConsumptionEditor.tsx` — identical props/contract to `QcConsumptionEditor`; separate file per constitution (one component per domain); ≤150 lines
- [X] T025 [P] [US2] Create `frontend/components/finition/FinitionTable.tsx` — receives `FinitionRecordSummary[]`; columns: source QC info, date, employee, quantity, status badge; expandable row or nested list for custom steps; empty state; ≤150 lines
- [X] T026 [US2] Create `frontend/components/finition/ReadinessPrompt.tsx` — modal overlay shown after finition/step save; displays "هل المنتج جاهز للمخزون النهائي؟" with Yes/No buttons; on Yes → renders `FinalStockForm`; on No → calls `onNotReady()` callback (used by US3); ≤150 lines
- [X] T027 [US2] Create `frontend/components/finition/FinalStockForm.tsx` — form step inside ReadinessPrompt; inputs: model name (text), size label (text), color (text); quantity pre-filled from source record (read-only); submits via `ipcClient.finition.addToFinalStock`; calls `onSuccess` on completion; ≤150 lines
- [X] T028 [US2] Create `frontend/components/finition/AddFinitionModal.tsx` — modal form: QC record select (shows model/size/color/finitionableRemaining), quantity input (≤ remaining), employee select, price per piece, auto-total (read-only), date picker, `FinitionConsumptionEditor`; on submit success → shows `ReadinessPrompt`; ≤150 lines
- [X] T029 [US2] Add Finition tab content to `frontend/app/(dashboard)/qc/page.tsx` — import `useFinitionData`, render `FinitionTable` + "+ إضافة تشطيب" button → `AddFinitionModal`; wire `onNotReady` to US3 custom step flow (stub for now)

**Checkpoint**: US2 fully functional — finition records created, ready path adds to final stock, KPIs update

---

## Phase 5: User Story 3 — Custom Processing Steps (Priority: P3)

**Goal**: After finition, if not ready, user can create a chain of named custom steps (كي، تغليف…) until the product is marked ready.

**Independent Test**: Create a finition record, answer "no" to readiness, create two custom steps, mark the second one ready, verify final stock entry links to the step.

- [X] T030 Add `createFinitionStep({ finitionId, stepName, quantity, employeeId, pricePerPiece, stepDate, consumptionEntries })` to `electron/features/finition/service.js` — validates quantity ≤ preceding record's quantity (finition_records.quantity for order=1, else previous step's quantity); assigns step_order as MAX+1; inserts finition_steps + finition_step_consumption_entries atomically
- [X] T031 Add `finition:createStep` channel to `electron/ipc/finition.handler.js`
- [X] T032 Add `finition.createStep` typed wrapper to `frontend/lib/ipc-client.ts`
- [X] T033 [US3] Create `frontend/components/finition/CustomStepModal.tsx` — modal form: step name input (free text), quantity input (pre-filled from previous quantity, can only decrease), optional employee select, optional price per piece, auto-total (read-only, shown only if price entered), date picker, `FinitionConsumptionEditor`; on submit success → shows `ReadinessPrompt`; `ReadinessPrompt` on No calls `onNotReady` to loop this same modal again; ≤150 lines
- [X] T034 [US3] Wire custom step loop in `frontend/app/(dashboard)/qc/page.tsx` — when `AddFinitionModal`'s `onNotReady` fires, open `CustomStepModal` with the finition id and current quantity; when `CustomStepModal`'s `onNotReady` fires, re-open `CustomStepModal` again (loop); pass `finitionId` and `precedingQuantity` as props through the chain

**Checkpoint**: US3 fully functional — multi-step loop works; each step saved as own record; final stock entry created at any step in the chain

---

## Phase 6: User Story 4 — Dashboard & KPI Overview (Priority: P4)

**Goal**: All 8 KPI counters are accurate, always up to date, and visible above the tabs on first load.

**Independent Test**: After creating QC and finition records, verify all KPI card values match expected totals per quickstart.md Scenario 6.

- [X] T035 [US4] Extend `getKpis` in `electron/features/qc/queries.js` to compute all 8 values — ensure `finitionPending` query correctly subtracts already-finitioned quantities per QC record; ensure `readyForStock` is `SUM(final_stock_entries.quantity)`
- [X] T036 [P] [US4] Update `frontend/components/qc/QcKpiCards.tsx` — confirm all 8 KPI labels/values render correctly with Arabic labels (معلق، مراجع، تالف، مقبول، جيد، جيد جداً، بانتظار التشطيب، جاهز للمخزون); apply distinct visual styling to تالف (red tint) and ready (green tint)
- [X] T037 [US4] Verify `frontend/app/(dashboard)/qc/page.tsx` calls `refetch()` on `useQcData` after every successful create operation (QC record, finition record, custom step, final stock entry) so KPIs stay in sync

**Checkpoint**: All 4 user stories complete and independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T038 Add QC & Finition navigation entry to the sidebar component (find sidebar in `frontend/components/shared/` or `frontend/app/(dashboard)/layout.tsx`) linking to `/qc`
- [X] T039 Add `EmptyState` components to `QcTable` (no QC records yet), `FinitionTable` (no finition records), and return batch select list in `AddQcRecordModal` (no batches pending QC)
- [ ] T040 Run all 6 quickstart.md scenarios manually in the app and confirm expected outcomes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Requires Phase 1 complete — blocks all user stories
- **Phase 3 (US1)**: Requires Phase 2 complete
- **Phase 4 (US2)**: Requires Phase 2 complete; reads QC records created by US1
- **Phase 5 (US3)**: Requires Phase 4 complete (extends finition service and modal)
- **Phase 6 (US4)**: Requires Phase 3 + Phase 4 complete (KPIs cover both domains)
- **Phase 7 (Polish)**: Requires all story phases complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only — independently testable
- **US2 (P2)**: Depends on Phase 2; reads from QC records (US1 creates them, but US2 backend can be built before US1 frontend)
- **US3 (P3)**: Depends on US2 complete — extends the finition service and modal
- **US4 (P4)**: Depends on US1 + US2 complete — aggregates from both domains

### Parallel Opportunities Within Each Phase

**Phase 1**: T003–T008 can all run in parallel (six separate files)

**Phase 3 (US1)**: T014, T015, T016 can run in parallel (three separate component files)

**Phase 4 (US2)**: T024, T025 can run in parallel (separate component files); T019–T023 are sequential backend setup

---

## Parallel Execution Examples

```
# Phase 1 — run in parallel after T001+T002 complete:
T003: electron/db/schema/qc_record.ts
T004: electron/db/schema/finition_record.ts
T005: electron/db/schema/finition_step.ts
T006: electron/db/schema/final_stock_entry.ts
T007: frontend/features/qc/qc.types.ts
T008: frontend/features/finition/finition.types.ts

# Phase 3 (US1) — run in parallel:
T014: QcConsumptionEditor.tsx
T015: QcKpiCards.tsx
T016: QcTable.tsx

# Phase 4 (US2) — run in parallel once T019-T023 complete:
T024: FinitionConsumptionEditor.tsx
T025: FinitionTable.tsx
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational QC backend
3. Complete Phase 3: US1 frontend
4. **STOP and VALIDATE**: Create a QC record end-to-end, verify grade validation and batch status update
5. Ship MVP — supervisor can review returned pieces

### Incremental Delivery

1. Phase 1 + 2 → QC backend ready
2. Phase 3 → US1: QC records ✅
3. Phase 4 → US2: Finition + final stock ✅
4. Phase 5 → US3: Custom step loop ✅
5. Phase 6 → US4: Full KPI dashboard ✅
6. Phase 7 → Polish and sidebar navigation ✅

---

## Summary

| Phase | Tasks | Parallel | Story |
|-------|-------|----------|-------|
| Phase 1: Setup | T001–T008 | T003–T008 | — |
| Phase 2: Foundational | T009–T013 | — | — |
| Phase 3: US1 QC Review | T014–T018 | T014–T016 | US1 |
| Phase 4: US2 Finition | T019–T029 | T024–T025 | US2 |
| Phase 5: US3 Custom Steps | T030–T034 | — | US3 |
| Phase 6: US4 KPI Dashboard | T035–T037 | T036 | US4 |
| Phase 7: Polish | T038–T040 | — | — |
| **Total** | **40 tasks** | **10 parallel** | |
