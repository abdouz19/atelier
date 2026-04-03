# Tasks: Distribution Modal Redesign & Cost Calculation

**Input**: Design documents from `/specs/020-distribution-modal-cost/`
**Branch**: `020-distribution-modal-cost`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- No test tasks — no automated test framework in use; see quickstart.md for manual verification

---

## Phase 1: Setup

**Purpose**: Update the shared type contract and IPC client — these are the foundation everything else builds on.

- [x] T001 Add `AvailablePartWithCost`, `PartGivenRow`, `Step1Values` interfaces and update `DistributePayload` (add `piecesCost`, `sewingCost`, `materialsCost`, `costPerFinalItem`, `expectedFinalQuantity`; update `parts` to `DistributePartRow[]` with `avgUnitCost`; add `consumptionRows` typed as `DistributionConsumptionRow[]`) in `frontend/features/distribution/distribution.types.ts`
- [x] T002 [P] Add 4 new IPC client methods (`getModelsWithPieces`, `getSizesForModel`, `getColorsForModelSize`, `getPartsWithCostForModelSizeColor`) to the `distribution` namespace and update the `distribute()` method type signature in `frontend/lib/ipc-client.ts`

**Checkpoint**: Types and IPC client updated — all frontend and backend work can now be built against correct interfaces.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema migration and new backend query handlers — must be complete before frontend UI can be wired to real data.

**⚠️ CRITICAL**: All Phase 3+ tasks depend on this phase.

- [x] T003 Add migration 020 to `electron/main.js` in the sequential migration block: (a) detect `pieces_cost` column on `distribution_batches`; if missing, recreate the table using the PRAGMA foreign_keys=OFF → rename → CREATE → INSERT → DROP pattern (same as 013 migration) adding `pieces_cost REAL`, `sewing_cost REAL`, `materials_cost REAL`, `cost_per_final_item REAL` columns and fixing CHECK constraints to `sewing_price_per_piece >= 0` and `total_cost >= 0`; (b) idempotent `ALTER TABLE distribution_batch_parts ADD COLUMN avg_unit_cost REAL` guarded by try/catch
- [x] T004 Add 4 new `ipcMain.handle` blocks to `electron/main.js` immediately after the existing `distribution:` handlers: `distribution:getModelsWithPieces` (DISTINCT model_name from cutting_pieces+cutting_sessions WHERE status='not_distributed'); `distribution:getSizesForModel` (DISTINCT size_label filtered by modelName); `distribution:getColorsForModelSize` (DISTINCT color filtered by modelName+sizeLabel); `distribution:getPartsWithCostForModelSizeColor` (part_name + COUNT(cp.id) as available_count + AVG(COALESCE(csp.unit_cost,0)) as avg_unit_cost joining cutting_pieces→cutting_sessions→cutting_session_parts on session_id+part_name+size_label WHERE status='not_distributed' and model+size+color match)
- [x] T005 Update 3 existing query strings in `electron/main.js` that use `SUM(total_cost)` for tailor earnings balance: in `distribution:getKpis`, `distribution:getSummary`, and `distribution:getDetailByTailor` replace `SUM(total_cost)` with `SUM(COALESCE(sewing_cost, total_cost))` to remain backward-compatible with pre-020 records that have NULL sewing_cost

**Checkpoint**: DB schema updated with cost columns; 4 new cascading filter endpoints live; earnings balance backward-compatible.

---

## Phase 3: User Story 1 — Full Distribution Creation with Cost Tracking (Priority: P1) 🎯 MVP

**Goal**: A user can complete the full 2-step flow — tailor/model/size/color selection, sewing inputs, parts with avg unit cost, consumed materials, live cost card — submit a distribution, have pieces marked as distributed, and see all 6 cost fields stored.

**Independent Test**: Open the distribution modal, complete both steps with 2 part rows and 1 material consumption, submit, and verify: the distribution record in DB has `pieces_cost + sewing_cost + materials_cost = total_cost` (to 2 decimal places); the selected cutting_pieces rows have `status='distributed'`; `distribution_piece_links` has one row per piece; `distribution_batch_parts.avg_unit_cost` is populated.

### Implementation

- [x] T006 [P] [US1] Create `DistributionCostCard.tsx` in `frontend/components/distribution/` as a named export: accept props `{ piecesCost, sewingCost, materialsCost, totalCost, costPerFinalItem, expectedFinalQuantity, frozen?: boolean }`; render 5 lines in RTL with `dir="rtl"`: تكلفة الأجزاء المعطاة (muted), تكلفة الخياطة (muted), تكلفة المواد المستهلكة (muted), التكلفة الإجمالية للتوزيع (bold amber when not frozen, normal when frozen), تكلفة القطعة النهائية الواحدة = totalCost ÷ expectedFinalQuantity (muted, shows `—` when expectedFinalQuantity is 0); all values formatted `.toFixed(2) دج`; use Tailwind utility classes only
- [x] T007 [P] [US1] Create `PartGivenRowsEditor.tsx` in `frontend/components/distribution/` as a named export: accept props `{ availableParts: AvailablePartWithCost[], rows: PartGivenRow[], onChange: (rows: PartGivenRow[]) => void, error?: string }`; render one row per entry with 3 elements in RTL layout: (right) part select showing `partName — متاح: {availableCount}` in muted text per option, filtered to exclude parts already selected in other rows; (middle) quantity number input with real-time validation showing inline red error when quantity > availableCount; (left) read-only display showing `تكلفة الوحدة: {avgUnitCost.toFixed(2)} دج` and `الإجمالي: {(quantity * avgUnitCost).toFixed(2)} دج`; each row has a remove ✕ button (disabled when only 1 row); إضافة جزء button adds a blank row; total pieces cost footer line `إجمالي تكلفة الأجزاء: {sum.toFixed(2)} دج`; render `error` message below the rows when provided
- [x] T008 [US1] Create `DistributeStep1Form.tsx` in `frontend/components/distribution/` as a named export: accept props `{ nonFabricItems: NonFabricItem[], onNext: (values: Step1Values) => void }`; manage cascading selector state (tailorId+tailorName, modelName, sizeLabel, color) — each loads data via `ipcClient.distribution` methods and resets children on change; show size select disabled until model chosen, color select disabled until size chosen; render two side-by-side inputs: القطع المتوقعة النهائية (integer ≥ 1) and سعر الخياطة للقطعة (decimal ≥ 0) with a live sewing cost line below showing `{expectedQty} × {sewingPrice} = {sewingCost.toFixed(2)} دج`; render `PartGivenRowsEditor` (receives availableParts from getPartsWithCostForModelSizeColor, refreshed when model+size+color all selected); render date picker defaulting to today; render `ConsumedMaterialsEditor` collapsed with count badge; render `DistributionCostCard` pinned above footer (all costs updating live); disable Next button until: tailorId, modelName, sizeLabel, color all selected, expectedQty ≥ 1, sewingPrice entered (≥ 0), at least one part row with part selected and quantity valid, date selected; on Next click call `onNext(step1Values)` with computed `piecesCost`, `sewingCost`, `materialsCost`, `totalCost`, `costPerFinalItem` included
- [x] T009 [P] [US1] Update the `distribution:distribute` IPC handler in `electron/main.js`: destructure new payload fields (`piecesCost`, `sewingCost`, `materialsCost`, `costPerFinalItem`, `expectedFinalQuantity`, updated `parts[]` with `avgUnitCost`); update the `INSERT INTO distribution_batches` statement to include the 4 new cost columns and use `expectedFinalQuantity` for `expected_pieces_count`; update `INSERT INTO distribution_batch_parts` to include `avg_unit_cost`; add atomic piece-selection loop: for each part row, run `SELECT cp.id FROM cutting_pieces cp JOIN cutting_sessions cs ON cs.id=cp.session_id WHERE cp.status='not_distributed' AND cs.model_name=? AND cp.size_label=? AND cp.color=? AND cp.part_name=? ORDER BY cp.created_at ASC LIMIT ?` then `UPDATE cutting_pieces SET status='distributed', updated_at=? WHERE id IN (...)` and `INSERT INTO distribution_piece_links (id, batch_id, piece_id, created_at)` per piece — all within the existing `db.transaction(...)` wrapper; validate that found piece count equals requested quantity before proceeding (return error if insufficient)
- [x] T010 [US1] Create `DistributeStep2Review.tsx` in `frontend/components/distribution/` as a named export: accept props `{ step1Data: Step1Values, isSubmitting: boolean, submitError: string | null, onSubmit: () => void, onBack: () => void }`; render info grid (tailor name, model, size, color, date formatted DD/MM/YYYY); render parts given table (part | الكمية | متوسط التكلفة | الإجمالي) with one row per entry; show expected final items and sewing price line; render `ConsumedMaterialsEditor` in read-only/collapsed state (only if `materialBatchConsumptions.length > 0`, with count badge); render `DistributionCostCard` with `frozen` prop; footer: السابق button (right, calls onBack, disabled when isSubmitting) + توزيع button (left, primary color, calls onSubmit, shows 'جاري التوزيع...' while isSubmitting); show `submitError` when present
- [x] T011 [US1] Rewrite `DistributeModal.tsx` in `frontend/components/distribution/` as a 2-step stepper orchestrator: replace existing form with `step: 1 | 2` state; `step1Data: Step1Values | null`; load `nonFabricItems` once on mount via `ipcClient.cutting.getNonFabricItems()`; render `StepIndicator` with labels `['معلومات التوزيع', 'مراجعة وتأكيد']` and active step; `handleNext1(values)` → sets step1Data, advances to step 2; `handleSubmit2()` → builds `DistributePayload` from step1Data (converting `distributionDate` string to Unix timestamp ms, mapping `partRows` to `DistributePartRow[]`, mapping `materialBatchConsumptions` to `DistributionConsumptionRow[]`), calls `ipcClient.distribution.distribute(payload)`, handles success (calls `onSuccess(result)`, closes modal) and error (sets submitError); render `<DistributeStep1Form>` on step 1 and `<DistributeStep2Review>` on step 2

**Checkpoint**: Full 2-step flow works end-to-end. Distribution creates correctly with all cost fields and piece status updates.

---

## Phase 4: User Story 2 — Average Unit Cost Display per Part (Priority: P1)

**Goal**: The average unit cost shown per part row in الأجزاء المعطاة equals the mathematical average of `cutting_session_parts.unit_cost` across all not_distributed pieces of that part+model+size+color. Zero-cost fallback works for pre-018 pieces.

**Independent Test**: Select a part with pieces from 2 cutting sessions at different unit costs. Verify displayed average = mean of those two costs. Change quantity — verify row total = quantity × average immediately. Select a part with no unit_cost data — verify average shows 0.00 and row total 0.00.

### Implementation

- [x] T012 [US2] Audit and finalize average unit cost accuracy in `frontend/components/distribution/PartGivenRowsEditor.tsx`: confirm the `avgUnitCost` value displayed per row comes directly from `AvailablePartWithCost.avgUnitCost` (loaded from `distribution:getPartsWithCostForModelSizeColor`); confirm the row total `(quantity * avgUnitCost)` recomputes on every quantity keystroke using `useMemo` or direct expression; confirm the backend query in `electron/main.js` for `distribution:getPartsWithCostForModelSizeColor` correctly uses `AVG(COALESCE(csp.unit_cost, 0))` so parts with null unit_cost contribute 0 to the average; confirm the total pieces cost footer equals the sum of all row totals and updates live

**Checkpoint**: Average unit cost display is accurate and live-updating.

---

## Phase 5: User Story 3 — Consumed Materials with Batch-Level Cost (Priority: P2)

**Goal**: Non-fabric materials added via the consumed materials section contribute their cost to the DistributionCostCard live, appear in the Step 2 review summary, and are persisted as distribution_consumption_entries on submission.

**Independent Test**: In Step 1, expand consumed materials and add one material with 2 batches at different prices. Enter quantities. Verify: `تكلفة المواد المستهلكة` in the cost card = Σ(qty × price) per batch; `التكلفة الإجمالية للتوزيع` updates accordingly. Submit and verify `distribution_consumption_entries` has one row per batch consumed.

### Implementation

- [x] T013 [US3] Audit and finalize consumed materials integration in `frontend/components/distribution/DistributeStep1Form.tsx`: verify `consumedMaterialsCost` is computed via `useMemo` from `materialBatchConsumptions` (same formula: Σ batch.quantity × batch.pricePerUnit over all batches over all items); verify `DistributionCostCard` receives live `consumedMaterialsCost` and recomputes `totalCost = piecesCost + sewingCost + consumedMaterialsCost` on every change; verify count badge on مواد مستهلكة toggle shows the number of added material rows; confirm `Step1Values` passed to `onNext` includes `materialBatchConsumptions` and `consumedMaterialsCost`

**Checkpoint**: Consumed materials cost flows correctly into the cost card and submission payload.

---

## Phase 6: User Story 4 — Step 2 Review Before Confirmation (Priority: P2)

**Goal**: The Step 2 summary accurately reflects 100% of data entered in Step 1. Back navigation preserves all state. The توزيع button shows loading state.

**Independent Test**: Fill Step 1 completely with 2 parts, 1 consumed material, a specific date. Advance to Step 2. Verify every field (tailor name, model, size, color, date, both part rows with quantities/costs, expected qty, sewing price, materials section, full cost card) matches exactly what was entered. Click السابق, change one part's quantity, advance again — verify the changed value appears in Step 2.

### Implementation

- [x] T014 [US4] Audit and finalize `frontend/components/distribution/DistributeStep2Review.tsx`: verify the info grid shows all 5 fields (tailor name, model, size, color, formatted date); verify the parts table renders every PartGivenRow with part name, quantity, avgUnitCost, and rowTotal; verify the consumed materials section is omitted when `materialBatchConsumptions.length === 0`; verify `DistributionCostCard` shows the exact same computed values as the cost card in Step 1; verify clicking السابق calls `onBack()` with no data reset (all step1Data is preserved in the modal orchestrator state); verify توزيع button is disabled while `isSubmitting` and shows 'جاري التوزيع...'

**Checkpoint**: Step 2 review is a faithful read-only mirror of Step 1 data.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T015 [P] Verify `dir="rtl"` is set on the root element of all new components (`DistributionCostCard.tsx`, `PartGivenRowsEditor.tsx`, `DistributeStep1Form.tsx`, `DistributeStep2Review.tsx`, `DistributeModal.tsx`) and that no inline styles are used (replace any with Tailwind utility classes)
- [x] T016 [P] Check all new components use named exports; verify `DistributionCostCard.tsx` is ≤150 lines; verify `PartGivenRowsEditor.tsx` is ≤150 lines; `DistributeStep2Review.tsx` ≤150 lines; `DistributeModal.tsx` ≤150 lines; `DistributeStep1Form.tsx` may exceed 150 lines — if so, extract `SewingCostLine` and `CascadingSelectors` as local named sub-components within the same file to reduce the main component's line count
- [x] T017 Run the full end-to-end verification from `specs/020-distribution-modal-cost/quickstart.md` ← manual verification required (`npm run dev:electron`): complete Scenario 1 (full distribution with 2 parts + 1 material), Scenario 3 (cascading selectors), Scenario 4 (quantity over-limit validation), Scenario 5 (zero sewing price)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: T001 and T002 can start immediately and run in parallel with each other
- **Phase 2 (Foundational)**: T003, T004, T005 all in `electron/main.js` — run sequentially; depend on nothing from Phase 1
- **Phase 3 (US1)**: T006, T007, T009 depend on Phase 1+2 complete; T006/T007/T009 can run in parallel (different files); T008 depends on T006+T007; T010 depends on T006; T011 depends on T008+T009+T010
- **Phase 4 (US2)**: T012 depends on T007 (PartGivenRowsEditor) and T004 (backend query)
- **Phase 5 (US3)**: T013 depends on T008 (Step1Form)
- **Phase 6 (US4)**: T014 depends on T010 (Step2Review)
- **Phase 7 (Polish)**: T015–T016 depend on T006–T011; T017 depends on T011 (full flow wired)

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1+2 — core delivery, must be complete first
- **US2 (P1)**: Depends on T007 (PartGivenRowsEditor) + T004 (backend avg unit cost query) — finalization pass on top of US1
- **US3 (P2)**: Depends on T008 (Step1Form) — finalization pass on materials integration
- **US4 (P2)**: Depends on T010 (Step2Review) — finalization pass on review step

### Within US1

- T006, T007, T009 are independently writable (different files) — max parallelism after Phase 2
- T008 is the Step1Form — must follow T006 + T007
- T010 must follow T006 (imports DistributionCostCard)
- T011 is the integration task — must be last in US1

### Parallel Opportunities

- T001 || T002 (types and ipc-client — different files)
- T003 → T004 → T005 (all in main.js — sequential)
- T006 || T007 || T009 (after Phase 2 complete — different files)
- T008 after T006+T007; T010 after T006
- T015 || T016 (polish tasks on different concerns)

---

## Parallel Example: User Story 1

```
After T001 + T002 + T003 + T004 + T005 complete:

  Parallel batch:
    T006: Create DistributionCostCard.tsx
    T007: Create PartGivenRowsEditor.tsx
    T009: Update distribution:distribute handler in electron/main.js

  Then:
    T008: Create DistributeStep1Form.tsx (needs T006 + T007)
    T010: Create DistributeStep2Review.tsx (needs T006)

  Then sequential:
    T011: Rewrite DistributeModal.tsx (needs T008 + T009 + T010)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — the full usable flow)

1. Complete Phase 1: T001 + T002 (types + ipc-client)
2. Complete Phase 2: T003 + T004 + T005 (migration + backend handlers)
3. Complete Phase 3 in parallel batches: T006 + T007 + T009 → T008 + T010 → T011
4. Complete Phase 4: T012 (avg unit cost verification)
5. **STOP and VALIDATE**: Run quickstart.md Scenarios 1, 3, 4 — full distribution creation works
6. Ship MVP

### Incremental Delivery

1. T001–T002 → Types + client ready (no visible UI change yet)
2. T003–T005 → Backend updated (migration runs on next app start)
3. T006–T011 → Full 2-step flow live (US1 + US2 mostly complete)
4. T012 → Avg unit cost verified accurate (US2 complete)
5. T013 → Materials cost flowing correctly (US3 complete)
6. T014 → Review step verified faithful (US4 complete)
7. T015–T017 → Polish + full E2E validation pass

---

## Notes

- No automated tests — use `quickstart.md` for manual verification steps
- `ConsumedMaterialsEditor.tsx` requires **zero changes** — reused as-is
- `StepIndicator` component requires **zero changes** — reused as-is
- The existing `distribution:getActiveTailors` channel requires **zero changes** — used for tailor select
- T003 (migration) uses same PRAGMA foreign_keys=OFF pattern as the 013 migration (see lines 608–648 in `electron/main.js` for reference)
- All monetary computations use `round2(n) = Math.round(n * 100) / 100` — consistent with existing pattern in CostDistributionTable.tsx and CuttingStep3Form.tsx
- `Step1Values.distributionDate` is stored as ISO string `YYYY-MM-DD` in form state; converted to Unix timestamp ms in `DistributeModal.handleSubmit2()` before calling the IPC handler
