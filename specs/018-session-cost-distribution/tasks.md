# Tasks: Session Cost Calculation & Part Cost Distribution

**Input**: Design documents from `/specs/018-session-cost-distribution/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ipc-channels.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
**Tests**: Not requested — no test tasks generated.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Locale strings and TypeScript types — shared by all user stories. Can be done before any implementation.

- [x] T001 Add all new Arabic locale strings for cost/batch features to `frontend/public/locales/ar/common.json` (keys: `cutting.batchSelector.*`, `cutting.employeeCost.*`, `cutting.sessionCostPreview.*`, `cutting.costDistribution.*`)
- [x] T002 [P] Add new TypeScript interfaces to `frontend/features/cutting/cutting.types.ts`: `FabricBatch`, `MaterialBatch`, `FabricBatchEntry`, `MaterialBatchEntry`, `MaterialBatchConsumption`, `PartCost`, `CostDistributionLockState`, `CostDistributionRow`; extend `CreateCuttingSessionPayload` (replace `metersUsed` + `consumptionRows` with batch arrays, add cost fields + `partCosts`)

**Checkpoint**: Types and strings ready — all subsequent tasks can reference them

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema migrations — MUST complete before any backend or end-to-end work

**⚠️ CRITICAL**: No IPC handler changes or submission testing can occur until this phase is complete

- [x] T003 Apply schema migrations at startup in `electron/main.js`: add `fabric_cost REAL`, `employee_cost REAL`, `consumed_materials_cost REAL`, `total_session_cost REAL` columns to `cutting_sessions`; add `unit_cost REAL` to `cutting_session_parts`; add `unit_cost REAL` to `cutting_pieces`; create `cutting_batch_consumptions` table (full DDL in `data-model.md`)

**Checkpoint**: DB schema ready — backend handlers can now be implemented; existing sessions unaffected (NULL columns)

---

## Phase 3: User Story 1 — Fabric Batch Selection in Step 1 (Priority: P1) 🎯 MVP

**Goal**: Replace the simple meters input in Step 1 with a per-batch consumption table. User sees all purchase batches for the selected fabric+color, enters meters per batch, sees live fabric cost.

**Independent Test**: Open the cutting session modal → select a fabric and color → verify the batch table appears with correct rows (date, price/m, available qty) → enter quantities → verify the live fabric cost footer updates → enter an overdraw amount → verify red inline error and disabled Next button.

### Implementation for User Story 1

- [x] T004 [P] [US1] Add `cutting:getFabricBatches` IPC handler in `electron/main.js`: accept `{ stockItemId, color }`, query `stock_transactions` (type='inbound') LEFT JOIN `cutting_batch_consumptions` grouped by batch to compute `availableQuantity`, return `FabricBatch[]` ordered by `transaction_date DESC`
- [x] T005 [P] [US1] Add `cutting.getFabricBatches` method to `frontend/lib/ipc-client.ts`
- [x] T006 [P] [US1] Create `frontend/hooks/useFabricBatches.ts`: fetch `cutting:getFabricBatches` when `stockItemId` + `color` are both non-null; return `{ batches, isLoading, error }`; return empty array when either param is null
- [x] T007 [P] [US1] Create `frontend/components/cutting/BatchConsumptionTable.tsx`: controlled component (props: `batches: FabricBatch[]`, `isLoading`, `entries: FabricBatchEntry[]`, `onChange`); renders skeleton on loading, empty state when no batches, table with columns تاريخ الشراء / السعر/م / المتاح / الكمية المأخوذة; quantity input turns red and shows error when entry exceeds `availableQuantity`; footer shows total meters taken + live fabric cost in bold
- [x] T008 [US1] Modify `frontend/components/cutting/CuttingStep1Form.tsx`: remove `metersUsed` react-hook-form field; after fabric+color selection render `<BatchConsumptionTable>` wired to `useFabricBatches`; manage `fabricBatchEntries` state; derive `fabricCost` via `useMemo`; expose `fabricBatchEntries` and `fabricCost` to parent via callback; update Zod schema to validate that at least one entry has quantity > 0 and no entry exceeds available

**Checkpoint**: US1 fully functional — fabric batch table renders, quantities validate, live fabric cost displays, data flows to modal state

---

## Phase 4: User Story 2 — Consumed Materials Batch Selection in Step 2 (Priority: P2)

**Goal**: Each consumed material item in Step 2 shows a per-batch selector (same pattern as fabric). User selects batches and enters quantities. Consumed materials cost updates live.

**Independent Test**: In Step 2, add a consumed material → verify a batch selector appears below it with correct rows → enter quantities across batches → verify the consumed materials cost in the session cost preview card updates → enter an overdraw → verify inline error.

### Implementation for User Story 2

- [x] T009 [P] [US2] Add `cutting:getMaterialBatches` IPC handler in `electron/main.js`: accept `{ stockItemId, color? }`, same query pattern as `cutting:getFabricBatches` (LEFT JOIN `cutting_batch_consumptions`), filter by color only when non-null, JOIN `stock_items` to include `unit` field; return `MaterialBatch[]`
- [x] T010 [P] [US2] Add `cutting.getMaterialBatches` method to `frontend/lib/ipc-client.ts`
- [x] T011 [P] [US2] Create `frontend/hooks/useMaterialBatches.ts`: fetch `cutting:getMaterialBatches` keyed by `{ stockItemId, color }`; return `{ batches, isLoading, error }`; return empty array when `stockItemId` is null
- [x] T012 [US2] Extend `frontend/components/shared/ConsumedMaterialsEditor.tsx`: for each material row, add an expandable batch selector section (call `useMaterialBatches` per row); render a compact batch table (same column pattern as `BatchConsumptionTable` but using `pricePerUnit` and `unit`); make the top-level quantity field read-only (auto-computed as `SUM(batch quantities)`); emit updated `materialBatchConsumptions: MaterialBatchConsumption[]` and `consumedMaterialsCost: number` via `onChange` callback

**Checkpoint**: US2 functional — each material shows batch rows, quantities validate, materials cost derived from batch selections

---

## Phase 5: User Story 3 — Live Session Cost Display (Priority: P2)

**Goal**: A running session cost preview card is always visible at the bottom of Step 1, showing fabric cost + employee cost + consumed materials cost + total. Employee cost formula is shown as a read-only breakdown below the employees/layers fields.

**Independent Test**: Fill Step 1 (fabric batches, employees, layers, price per layer) → verify the employee cost summary shows the correct formula and total → verify the session cost preview card totals update live with every input change → navigate to Step 2, add material batches → verify the materials cost in the preview card updates.

### Implementation for User Story 3

- [x] T013 [P] [US3] Create `frontend/components/cutting/EmployeeCostSummary.tsx`: read-only display component (props: `layers`, `pricePerLayer`, `employeeCount`); renders formula `{layers} طبقة × {pricePerLayer} دج × {employeeCount} عامل = {total} دج` using locale strings; all values formatted with `toFixed(2)`
- [x] T014 [P] [US3] Create `frontend/components/cutting/SessionCostPreviewCard.tsx`: card component (props: `fabricCost`, `employeeCost`, `consumedMaterialsCost`); renders 3 labeled line items + bold grand total; all values `toFixed(2)`; updates on every prop change
- [x] T015 [US3] Modify `frontend/components/cutting/CuttingStep1Form.tsx`: render `<EmployeeCostSummary>` below employees/layers/pricePerLayer fields; render `<SessionCostPreviewCard fabricCost={} employeeCost={} consumedMaterialsCost={consumedMaterialsCostFromParent}>` at bottom of step content; derive `employeeCost = layers * pricePerLayer * employeeIds.length` via `useMemo`; expose `employeeCost` to parent
- [x] T016 [US3] Modify `frontend/components/cutting/NewCuttingSessionModal.tsx`: lift `fabricCost`, `employeeCost`, `consumedMaterialsCost` into modal state; thread `consumedMaterialsCost` from Step 2 back to Step 1 preview card; compute `totalSessionCost = fabricCost + employeeCost + consumedMaterialsCost` reactively; thread `totalSessionCost` into Step 2 as prop

**Checkpoint**: US3 functional — preview card visible and reactive throughout both steps, employee cost formula displayed clearly

---

## Phase 6: User Story 4 — Part Cost Distribution in Step 2 (Priority: P3)

**Goal**: Below the parts editor in Step 2, a cost distribution table appears. Each part row has an editable unit cost (defaulting to equal distribution) with auto/locked state. Grand total always equals session cost. Locked-only mismatch blocks submission.

**Independent Test**: Fill all parts rows in Step 2 → verify cost distribution table appears with correct default unit costs (session cost ÷ total pieces) → verify all row totals sum to session cost → edit one row's unit cost → verify it locks ("محدد") and auto rows adjust proportionally → lock all rows with a mismatch → verify grand total turns red and submit is disabled with error message.

### Implementation for User Story 4

- [x] T017 [P] [US4] Create `frontend/components/cutting/CostDistributionTable.tsx`: controlled component (props: `parts: PartRow[]`, `totalSessionCost`, `rows: CostDistributionRow[]`, `onChange`, `error`); renders table with columns الجزء / المقاس / العدد / التكلفة/قطعة / الإجمالي; each unit cost field shows "تلقائي" badge (auto) or "محدد" badge (locked); on unit cost edit: mark row locked, redistribute remaining `totalSessionCost` equally among auto rows with last-auto-row rounding absorption; grand total footer: green when matches `totalSessionCost`, red otherwise; shows error banner when `error` prop is non-null
- [x] T018 [US4] Modify `frontend/components/cutting/CuttingStep2Form.tsx`: render `<CostDistributionTable>` below the parts editor, wired to `parts` state and `totalSessionCost` prop; initialize `costDistributionRows` from `parts` whenever parts change (recalculate defaults for auto rows); expose `partCosts: PartCost[]` and `hasCostMismatch: boolean` to parent; block Next/Submit button when `hasCostMismatch` is true
- [x] T019 [US4] Modify `frontend/components/cutting/NewCuttingSessionModal.tsx`: pass `totalSessionCost` into `CuttingStep2Form`; receive `partCosts` and `hasCostMismatch` from Step 2; disable submit button when `hasCostMismatch`

**Checkpoint**: US4 functional — distribution table auto-calculates, locking/auto logic works, mismatch blocks submission

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end submission persistence — wire all new payload fields into `cutting:create` and verify the complete flow saves correctly.

- [x] T020 Extend `cutting:create` handler in `electron/main.js`: (a) validate each `fabricBatchConsumption.quantity ≤ availableQuantity` (re-query inside transaction); (b) validate each material batch entry similarly; (c) derive `metersUsed = SUM(fabricBatchConsumptions[].quantity)` for backward compat; (d) insert one row in `cutting_batch_consumptions` per fabric batch (`is_fabric=1`) and per material batch entry (`is_fabric=0`); (e) store `fabric_cost`, `employee_cost`, `consumed_materials_cost`, `total_session_cost` on the session; (f) match `partCosts[]` to inserted `cutting_session_parts` rows by `(partName, sizeLabel)` and store `unit_cost`; (g) store `unit_cost` on each `cutting_pieces` row from its matched part
- [x] T021 [P] Update `frontend/components/cutting/NewCuttingSessionModal.tsx` `handleSubmit`: build final `CreateCuttingSessionPayload` with `fabricBatchConsumptions`, `materialBatchConsumptions`, `fabricCost`, `employeeCost`, `consumedMaterialsCost`, `totalSessionCost`, `partCosts`; remove old `metersUsed` and `consumptionRows` fields
- [x] T022 [P] Update `frontend/components/cutting/CuttingSessionDetail.tsx`: display `fabric_cost`, `employee_cost`, `consumed_materials_cost`, `total_session_cost` if non-null; show "—" for sessions created before this feature (NULL values)
- [x] T023 [P] Add `NULL` cost display guard across cutting summary/list views: where `totalCost` was previously displayed, handle NULL gracefully (show "—" or 0.00 consistently)

**Checkpoint**: Full end-to-end flow works — session creates, batch consumptions persisted, costs stored, pieces have unit_cost, detail view shows costs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 types being defined — **BLOCKS** T004, T009, T020
- **Phase 3 (US1)**: Depends on Phase 1 + Phase 2
- **Phase 4 (US2)**: Depends on Phase 1 + Phase 2; independent of US1
- **Phase 5 (US3)**: Depends on Phase 3 (needs `fabricCost` from Step1Form)
- **Phase 6 (US4)**: Depends on Phase 5 (needs `totalSessionCost` from modal)
- **Phase 7 (Polish)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no story dependencies
- **US2 (P2)**: After Phase 2 — no story dependencies (can run in parallel with US1)
- **US3 (P2)**: After US1 complete — needs `fabricCost` + `fabricBatchEntries` state wired in Step1Form
- **US4 (P3)**: After US3 complete — needs `totalSessionCost` flowing into Step2Form

### Parallel Opportunities

- T001 ‖ T002 — locale strings and types are fully independent
- T003 — can overlap with T001/T002 (different files)
- T004 ‖ T005 ‖ T006 ‖ T007 — backend handler, IPC client, hook, component all independent files
- T009 ‖ T010 ‖ T011 ‖ T012 — same pattern for US2
- T013 ‖ T014 — two new components, independent files
- T020 ‖ T021 ‖ T022 ‖ T023 — Polish tasks touch different files

---

## Parallel Example: User Story 1

```bash
# Run all in parallel (different files, no blocking dependencies):
Task T004: cutting:getFabricBatches handler in electron/main.js
Task T005: ipc-client method in frontend/lib/ipc-client.ts
Task T006: useFabricBatches hook in frontend/hooks/useFabricBatches.ts
Task T007: BatchConsumptionTable component in frontend/components/cutting/BatchConsumptionTable.tsx

# Then sequentially (depends on T006 + T007):
Task T008: Modify CuttingStep1Form.tsx to wire everything together
```

## Parallel Example: User Story 2

```bash
# Run all in parallel:
Task T009: cutting:getMaterialBatches handler in electron/main.js
Task T010: ipc-client method in frontend/lib/ipc-client.ts
Task T011: useMaterialBatches hook in frontend/hooks/useMaterialBatches.ts

# Then (depends on T011):
Task T012: Extend ConsumedMaterialsEditor.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: US1 (T004–T008)
4. **STOP and VALIDATE**: Batch table renders, quantities validate, live fabric cost works
5. Continue to US2 → US3 → US4 → Polish

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. US1 → Fabric batch selection works in UI (cost not yet saved)
3. US2 → Materials batch selection works
4. US3 → Live cost preview visible throughout
5. US4 → Part cost distribution table works
6. Phase 7 → Everything persists end-to-end ✅

---

## Notes

- `cutting:create` in `electron/main.js` must remain backward-compatible — existing sessions must still be readable
- The `metersUsed` column is preserved and derived from batch quantities for all new sessions
- NULL cost columns on old sessions: display as "—" in detail view, 0 in cost cards
- `CostDistributionTable` last-auto-row rounding rule: guarantees grand total = sessionCost exactly
- All new Arabic strings go through `public/locales/ar/common.json` — no hardcoded JSX strings
