# Tasks: Cutting, Distribution, QC & Finition Flow Finalization

**Input**: Design documents from `/specs/015-consumed-materials-flows/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ipc-channels.md ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story — each phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migrations and TypeScript type changes that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Add `size_label TEXT NOT NULL DEFAULT ''` column to `cutting_session_parts` table via idempotent `ALTER TABLE` in `initializeDatabase()` in `electron/main.js` (wrap in try/catch that ignores "duplicate column" errors)
- [x] T002 Add `CREATE TABLE IF NOT EXISTS distribution_consumption_entries (id TEXT PK, batch_id TEXT FK→distribution_batches, stock_item_id TEXT FK→stock_items, color TEXT, quantity REAL CHECK>0, created_at TEXT, updated_at TEXT)` in `initializeDatabase()` in `electron/main.js`
- [x] T003 [P] Add `sizeLabel: string` field to `CuttingPartRow` interface and remove top-level `sizeLabel` from `CreateCuttingSessionPayload` in `frontend/features/cutting/cutting.types.ts`
- [x] T004 [P] Add `consumptionRows: ConsumptionRow[]` field to `DistributePayload` interface in `frontend/features/distribution/distribution.types.ts`
- [x] T005 Update `cutting.create` signature in `frontend/lib/ipc-client.ts` to use the updated `CreateCuttingSessionPayload` (with `sizeLabel` per part row, not on session)
- [x] T006 Update `distribution.distribute` signature in `frontend/lib/ipc-client.ts` to use updated `DistributePayload` (with `consumptionRows`)

**Checkpoint**: DB schema is up to date and all TypeScript types compile without errors.

---

## Phase 2: Foundational (Shared Component)

**Purpose**: Build the `ConsumedMaterialsEditor` shared component that all user story phases depend on.

**⚠️ CRITICAL**: All modal phases (US1–US5) depend on this component.

- [x] T007 Create `frontend/components/shared/ConsumedMaterialsEditor.tsx` with props `nonFabricItems: NonFabricItem[]`, `value: ConsumptionRow[]`, `onChange: (rows: ConsumptionRow[]) => void`, `disabled?: boolean` — collapsed by default, toggled by "مواد مستهلكة" button
- [x] T008 Implement the repeatable row pattern inside `ConsumedMaterialsEditor`: stock item dropdown (non-fabric items with available quantity shown, zero-stock items disabled), conditional color variant dropdown (only when selected item has `colors.length > 0`), quantity number input with red border + available-quantity message when exceeded
- [x] T009 Add "إضافة مادة مستهلكة" button below rows and per-row remove button in `frontend/components/shared/ConsumedMaterialsEditor.tsx`; filter out blank rows (no `stockItemId`) before emitting via `onChange`
- [x] T010 Add all new Arabic string keys to `frontend/public/locales/ar/common.json`: `"consumedMaterials"`, `"addConsumedMaterial"`, `"availableStock"`, `"exceedsAvailableStock"`, `"sizeLabel"`, `"addPart"`, `"totalCost"`, `"availableMeters"`

**Checkpoint**: `ConsumedMaterialsEditor` renders, collapses/expands, adds/removes rows, and validates quantities correctly when wired to a static mock `NonFabricItem[]`.

---

## Phase 3: User Story 1 — Cutting Session with Full Details (Priority: P1) 🎯 MVP

**Goal**: A user can open the New Cutting Session modal, fill in Step 1 (fabric cascade, live meter validation, live cost), complete Step 2 (produced parts with per-row size, consumed materials), and submit — all operations applied atomically.

**Independent Test**: Create a cutting session with fabric=X, color=Y (50m available), enter 60m → blocked. Enter 40m → proceeds to Step 2. Add 2 part rows with different sizes. Add 1 consumed material row with valid quantity and submit. Verify `cutting_session_parts` has 2 rows each with `size_label`, `cutting_parts` aggregate updated, fabric `stock_transactions` deducted, consumed material `stock_transactions` deducted.

### Implementation for User Story 1

- [x] T011 [US1] Update `frontend/components/cutting/PartRowsEditor.tsx` to add `sizeLabel` field per row: replace the existing part-only row with `(part ManagedDropdown via lookups:getParts/createPart) + (size ManagedDropdown via lookups:getSizes/createSize) + (count number input)`; update `PartRow` usage to emit `{ partName, sizeLabel, count }[]`
- [x] T012 [US1] Update `frontend/components/cutting/CuttingStep1Form.tsx`: remove the `sizeLabel` / size field entirely (it now lives in Step 2); add muted available-meters hint text below the meters input showing `متاح: {availableMeters} م`; add a read-only total cost field below the layers/pricePerLayer row, computed as `layers × pricePerLayer` via `react-hook-form watch()`, updating live
- [x] T013 [US1] Update `frontend/components/cutting/CuttingStep2Form.tsx`: replace any existing modal-specific consumption editor with the new shared `<ConsumedMaterialsEditor>` component; pass `nonFabricItems` fetched from `cutting:getNonFabricItems` (add the hook call if not already present)
- [x] T014 [US1] Update `ipcMain.handle('cutting:create', ...)` in `electron/main.js`: (a) stop reading `payload.sizeLabel` for the session; (b) write `cutting_sessions.size_label = ''`; (c) for each part row, write `cutting_session_parts.size_label = partRow.sizeLabel`; (d) for the `cutting_parts` aggregate upsert, use `partRow.sizeLabel` as the `size_label` key (not the session-level value)
- [x] T015 [US1] Update `frontend/components/cutting/NewCuttingSessionModal.tsx` to remove `sizeLabel` from the Step 1 → Step 2 pass-through and update `Step1Values` usage so TypeScript compiles with no errors

**Checkpoint**: Full cutting session flow works end-to-end. Step 1 hides size, shows live cost and available-meters hint. Step 2 part rows each have part + size + quantity. Consumed materials section works. Submission updates stock correctly.

---

## Phase 4: User Story 2 — Consumed Materials During Distribution (Priority: P2)

**Goal**: The Distribute modal has a collapsed "مواد مستهلكة" section at the bottom. When expanded, the user can add consumed material rows with real-time stock validation. Submission deducts all materials atomically and logs `distribution_consumption_entries`.

**Independent Test**: Open Distribute modal, fill existing fields, expand consumed materials section, add 1 non-fabric item (valid), add 1 with excess quantity → blocked. Fix quantity → submit. Verify `distribution_consumption_entries` has 1 row, and `stock_transactions` has a corresponding `type='consumed', source_module='distribution'` row.

### Implementation for User Story 2

- [x] T016 [US2] Update `frontend/components/distribution/DistributeModal.tsx`: add a `cutting:getNonFabricItems` call (in the component or its hook), render `<ConsumedMaterialsEditor nonFabricItems={...} value={consumptionRows} onChange={setConsumptionRows} />` at the bottom of the form (before the submit button), and include `consumptionRows` in the submitted payload
- [x] T017 [US2] Update `ipcMain.handle('distribution:distribute', ...)` in `electron/main.js`: (a) accept `consumptionRows` from payload; (b) inside the existing `db.transaction()`, after inserting `distribution_batches` and `distribution_batch_parts`: validate each row's quantity against available stock, insert `distribution_consumption_entries` rows, insert corresponding `stock_transactions` rows (`type='consumed'`, `source_module='distribution'`, `source_reference_id=batchId`); (c) rollback the entire transaction if any row has insufficient stock

**Checkpoint**: Distribute modal shows consumed materials section. Invalid quantities block submission. Valid submission creates `distribution_consumption_entries` and deducts from stock.

---

## Phase 5: User Story 3 — Consumed Materials During Return (Priority: P2)

**Goal**: The Return modal's existing consumed materials section is replaced with the shared `ConsumedMaterialsEditor` component, ensuring identical behavior to all other modals.

**Independent Test**: Open Return modal, select tailor + batch, expand consumed materials, add 1 valid row, submit. Verify `return_consumption_entries` row exists and stock is deducted. The section behaves identically to the one in the Distribute modal.

### Implementation for User Story 3

- [x] T018 [US3] Update `frontend/components/distribution/ReturnModal.tsx`: replace the existing `ReturnConsumptionEditor` (or inline consumption UI) with `<ConsumedMaterialsEditor nonFabricItems={nonFabricItems} value={consumptionRows} onChange={setConsumptionRows} />` ; ensure `nonFabricItems` is fetched via `cutting:getNonFabricItems`; pass `consumptionRows` in the submit payload (payload structure unchanged — `return_consumption_entries` IPC handler already handles this)

**Checkpoint**: Return modal uses the shared component. Visual appearance and validation behavior match the Distribute modal exactly.

---

## Phase 6: User Story 4 — Consumed Materials During QC (Priority: P3)

**Goal**: The QC modal's consumed materials section uses the shared `ConsumedMaterialsEditor` component.

**Independent Test**: Open QC modal, fill existing QC fields, expand consumed materials, add 1 valid row, submit. Verify `qc_consumption_entries` row exists and stock is deducted.

### Implementation for User Story 4

- [x] T019 [US4] Update `frontend/components/qc/AddQcRecordModal.tsx`: replace any existing inline consumption editor with `<ConsumedMaterialsEditor nonFabricItems={nonFabricItems} value={consumptionRows} onChange={setConsumptionRows} />`; fetch `nonFabricItems` via `cutting:getNonFabricItems`; include `consumptionRows` in the submit payload (existing `qc:create` handler already processes them — confirm or update if the field name differs)

**Checkpoint**: QC modal consumed materials section is visually and behaviorally identical to Distribute and Return modals.

---

## Phase 7: User Story 5 — Consumed Materials During Finition (Priority: P3)

**Goal**: The Finition modal's consumed materials section uses the shared `ConsumedMaterialsEditor` component.

**Independent Test**: Open Finition modal, fill existing finition fields, expand consumed materials, add 1 valid row, submit. Verify `finition_consumption_entries` row exists and stock is deducted.

### Implementation for User Story 5

- [x] T020 [US5] Update `frontend/components/finition/AddFinitionRecordModal.tsx`: replace any existing inline consumption editor with `<ConsumedMaterialsEditor nonFabricItems={nonFabricItems} value={consumptionRows} onChange={setConsumptionRows} />`; fetch `nonFabricItems` via `cutting:getNonFabricItems`; include `consumptionRows` in the submit payload (confirm `finition:create` handler already processes them or update accordingly)

**Checkpoint**: All five modals (cutting, distribute, return, QC, finition) now use the identical shared `ConsumedMaterialsEditor`. Behavior is consistent across all.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, edge case hardening, and end-to-end validation.

- [x] T021 [P] Verify `ConsumedMaterialsEditor` stays ≤ 150 lines per constitution; if over, extract a `ConsumptionRowItem` sub-component to `frontend/components/shared/ConsumptionRowItem.tsx`
- [x] T022 [P] Audit all `cutting_parts` aggregate upsert paths in `electron/main.js` — grep for `size_label` writes and confirm every write now reads from `partRow.sizeLabel` (not from session payload); fix any missed reference
- [ ] T023 Manually run the full flow end-to-end in the Electron dev app: create cutting session → distribute → return → QC → finition — verify stock balances after each step match expected deductions with zero discrepancy
- [x] T024 [P] Verify all new Arabic string keys in `frontend/public/locales/ar/common.json` are referenced in JSX (no hardcoded Arabic strings remain in any modified component)
- [x] T025 [P] Run TypeScript compiler (`tsc --noEmit`) across the full project and fix any type errors introduced by the payload changes in `cutting.types.ts`, `distribution.types.ts`, and `ipc-client.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational — Shared Component)**: Depends on Phase 1 (types must compile first)
- **Phase 3 (US1 — Cutting)**: Depends on Phase 1 + Phase 2
- **Phase 4 (US2 — Distribute)**: Depends on Phase 1 + Phase 2 (independent of Phase 3)
- **Phase 5 (US3 — Return)**: Depends on Phase 2 only (backend already done)
- **Phase 6 (US4 — QC)**: Depends on Phase 2 only (backend already done)
- **Phase 7 (US5 — Finition)**: Depends on Phase 2 only (backend already done)
- **Phase 8 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1 + Phase 2 — blocks nothing downstream
- **US2 (P2)**: Depends on Phase 1 + Phase 2 — can run parallel with US1
- **US3 (P2)**: Depends on Phase 2 only — can run parallel with US1 and US2
- **US4 (P3)**: Depends on Phase 2 only — can run parallel with US1–US3
- **US5 (P3)**: Depends on Phase 2 only — can run parallel with US1–US4

### Within Each User Story

- Backend IPC handler changes can be done before or after UI changes (no dependency)
- UI changes in a modal depend on `ConsumedMaterialsEditor` existing (Phase 2)
- `PartRowsEditor` changes (T011) can be done parallel with `CuttingStep1Form` changes (T012)

### Parallel Opportunities

- T003 and T004 (type updates in different files) — fully parallel
- T005 and T006 (ipc-client updates) — fully parallel after T003/T004
- T011 and T012 (PartRowsEditor + Step1Form) — different files, fully parallel
- T016 and T017 (DistributeModal UI + IPC handler) — different files, fully parallel
- T018, T019, T020 (Return/QC/Finition modals) — all different files, fully parallel after Phase 2
- T021, T022, T024, T025 (polish tasks) — all fully parallel

---

## Parallel Example: Phase 3 (User Story 1)

```
Parallel group A — run together:
  T011: Update PartRowsEditor.tsx (add sizeLabel per row)
  T012: Update CuttingStep1Form.tsx (remove sizeLabel, add cost/hint)

Sequential after A:
  T013: Update CuttingStep2Form.tsx (use shared ConsumedMaterialsEditor)
  T014: Update cutting:create IPC handler (write sizeLabel from part rows)
  T015: Update NewCuttingSessionModal.tsx (remove sizeLabel pass-through)
```

## Parallel Example: Phases 5–7 (US3, US4, US5 — all modal swaps)

```
Run all together after Phase 2 is complete:
  T018: ReturnModal.tsx → swap to ConsumedMaterialsEditor
  T019: AddQcRecordModal.tsx → swap to ConsumedMaterialsEditor
  T020: AddFinitionRecordModal.tsx → swap to ConsumedMaterialsEditor
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational component (T007–T010)
3. Complete Phase 3: Cutting session full flow (T011–T015)
4. **STOP and VALIDATE**: Create cutting session end-to-end in the app — verify step 1 UX, per-row sizes, consumed materials, stock deductions
5. If MVP validates → proceed to Phase 4

### Incremental Delivery

1. Phase 1+2 → Foundation ready (types + shared component)
2. Phase 3 → Cutting session works → Demo / Validate
3. Phase 4 → Distribute consumed materials → Demo
4. Phase 5+6+7 → Return / QC / Finition (can be batched, all are simple swaps)
5. Phase 8 → Polish and verify

### Single-Developer Order (Recommended)

```
T001 → T002 → T003+T004 (parallel) → T005+T006 (parallel)
→ T007 → T008 → T009 → T010
→ T011+T012 (parallel) → T013 → T014 → T015
→ T016+T017 (parallel)
→ T018+T019+T020 (parallel)
→ T021+T022+T024+T025 (parallel) → T023
```

---

## Notes

- T001 **must** wrap the `ALTER TABLE` in try/catch — SQLite throws if the column already exists on a dev DB that ran this migration before
- T014 is the highest-risk task: the `cutting_parts` upsert must read `size_label` from each part row; a missed reference will silently insert blank size labels into the aggregate. Validate with T022.
- T016 requires a `cutting:getNonFabricItems` call in the DistributeModal hook — confirm this channel is already exposed on `window.ipcBridge.cutting` in `electron/preload.js`, or add it
- For T019 and T020 (QC and Finition), first check if the existing inline consumption editors already use a `consumptionRows` field name in their IPC payloads — if so, the backend handlers need no changes and only the UI swap is required
