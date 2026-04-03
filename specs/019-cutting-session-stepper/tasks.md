# Tasks: Cutting Session Stepper Redesign & Cost Logic Fix

**Input**: Design documents from `/specs/019-cutting-session-stepper/`
**Branch**: `019-cutting-session-stepper`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- No test tasks — no automated test framework in use; see quickstart.md for manual verification

---

## Phase 1: Setup

**Purpose**: Update the shared type contract and IPC handler — these are the foundation everything else builds on.

- [x] T001 Add `EmployeeEntry` interface and update `CreateCuttingSessionPayload` (remove `employeeIds`, `layers`, `pricePerLayer`; add `employeeEntries: EmployeeEntry[]` and `employeeCost: number`) in `frontend/features/cutting/cutting.types.ts`
- [x] T002 [P] Update `cutting:create` IPC handler in `electron/main.js`: destructure `employeeEntries` instead of `employeeIds`/`layers`/`pricePerLayer`; validate each `employeeEntry.employeeId`; insert `layers=0, price_per_layer=0` into `cutting_sessions`; loop `employeeEntries` for per-employee `employee_operations` inserts using each entry's own `layers`, `pricePerLayer`, and `total_amount`; update return `totalCost` to use `totalSessionCost ?? employeeCost`

**Checkpoint**: Types and backend contract updated — frontend step components can now be built against the correct interfaces.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Refactor the modal orchestrator to the 4-step structure before any step content is built.

**⚠️ CRITICAL**: Step components depend on the modal's step state shape and step indicator.

- [x] T003 Refactor `NewCuttingSessionModal.tsx` to 4-step orchestrator: replace `step: 1|2` with `step: 1|2|3|4`; replace `step1Data`/`step2Data` state with `step1Data: Step1Values|null`, `step2Data: Step2Values|null`, `step3Data: Step3Values|null`; update `StepIndicator` to 4 labels (`['القماش والموديل', 'الموظفون والطبقات', 'الأجزاء والمواد', 'التوزيع والملاحظات']`); add `totalSessionCost` computed from all three cost parts; stub `handleNext1`, `handleNext2`, `handleNext3`, `handleSubmit4` handlers; render placeholder `<div>` for steps 2–4 until step components are built (step 1 keeps existing form temporarily)

**Checkpoint**: Modal shell is wired for 4 steps — individual step components can now be built and dropped in.

---

## Phase 3: User Story 1 — Full Session Creation with Cost Distribution (Priority: P1) 🎯 MVP

**Goal**: A user can complete the full 4-step flow: fabric+model selection → per-employee entry → parts+materials → cost distribution → submission with all records persisted correctly.

**Independent Test**: Open the wizard, fill all 4 steps with valid data (2 employees with different layers/prices, 2 part rows), submit, and verify the cutting session row appears in the list with correct total cost, and the employee operations in the employee detail view each show their individual earnings.

### Implementation

- [x] T004 [US1] Refactor `CuttingStep1Form.tsx`: remove the entire employees section (checkbox list, layers input, pricePerLayer input, employeeCost display), date picker, notes field, and session cost summary card from the JSX and form schema; update `Step1Values` export to `{ fabricItemId, fabricColor, modelName, availableMeters, metersUsed, fabricBatchEntries, fabricCost }`; update Zod schema to remove `employeeIds`, `layers`, `pricePerLayer`, `sessionDate`, `notes`; ensure the Next button guard only requires fabric, color, valid batch quantity, and model
- [x] T005 [P] [US1] Rewrite `CuttingStep2Form.tsx` entirely: manage `employeeRowState: Array<{ employeeId, name, checked, layers: string, pricePerLayer: string }>` loaded from `ipcClient.employees.getAll()` (active only); render checkbox list in a scrollable container; for each checked employee render an expanded detail row with: employee name label (right), layers number input (middle), price-per-layer number input, read-only total (layers×price); render total employee cost footer line; export `Step2Values = { employeeEntries: EmployeeEntry[], employeeCost: number }`; validate on Next click using Zod (min 1 employee, each entry layers≥1 and pricePerLayer>0); disable Next until valid
- [x] T006 [P] [US1] Create new `CuttingStep3Form.tsx`: accept props `{ fabricCost, employeeCost, modelName, onNext, onBack, nonFabricItems }`; render `<PartRowsEditor>` at top; render `<ConsumedMaterialsEditor>` below (collapsed by default, count badge on toggle); compute `consumedMaterialsCost` from `materialBatchConsumptions` via `useMemo`; render pinned cost summary card above the footer showing 4 lines (تكلفة القماش, تكلفة العمال, تكلفة المواد, التكلفة الإجمالية — total in amber bold); disable Next until at least one PartRow has partName, sizeLabel, and count≥1; export `Step3Values = { parts, materialBatchConsumptions, consumedMaterialsCost }`
- [x] T007 [P] [US1] Create new `CuttingStep4Form.tsx`: accept props `{ fabricCost, employeeCost, consumedMaterialsCost, totalSessionCost, parts, isSubmitting, submitError, onSubmit, onBack }`; render read-only cost summary block at top (same 4 lines as Step3 card, no amber emphasis); render `<CostDistributionTable parts={parts} totalSessionCost={totalSessionCost} rows={costDistributionRows} onChange={setCostDistributionRows} onPartCosts={setPartCosts} />`; render notes textarea (optional) and date input (required, defaulting to today's date) side-by-side below the table; derive `hasCostMismatch` from `costDistributionRows`; show مجموع تكاليف الأجزاء لا يساوي تكلفة الجلسة error when mismatch; disable إنشاء الجلسة button when `hasCostMismatch || isSubmitting || !date`; export `Step4Values = { partCosts, sessionDate: string, notes?: string }`
- [x] T008 [US1] Wire all 4 steps and submit handler in `NewCuttingSessionModal.tsx`: replace step placeholders with real components (`<CuttingStep1Form>`, `<CuttingStep2Form>`, `<CuttingStep3Form>`, `<CuttingStep4Form>`); load `nonFabricItems` once on mount and pass to Step3; implement `handleSubmit4(step4Values)` that builds the full `CreateCuttingSessionPayload` from all four step data objects (including deriving `consumptionRows` legacy field from `materialBatchConsumptions`); call `ipcClient.cutting.create(payload)` and handle success/error

**Checkpoint**: Full 4-step creation flow works end-to-end. Single employee session can be created and verified in the session list.

---

## Phase 4: User Story 2 — Multi-Batch Fabric Consumption with Live Cost (Priority: P1)

**Goal**: Entering quantities across multiple fabric batches immediately shows live fabric cost and blocks over-consumption in real time.

**Independent Test**: On Step 1, select a fabric+color with 2 batches at different prices. Enter quantities in both. Verify fabric cost = sum(qty×price). Enter an amount exceeding one batch's available stock and verify the input turns red immediately and Next stays disabled.

*Note: The `BatchConsumptionTable.tsx` component is already correct (real-time validation, overdraw highlighting, live cost footer). This story's tasks ensure Step1Form correctly gates on batch validation and that the live cost line is visible below the table.*

### Implementation

- [x] T009 [US2] Verify and finalize Step 1 batch validation gate in `frontend/components/cutting/CuttingStep1Form.tsx`: confirm the Next button (submit) guard reads `fabricBatchEntries`, checks `activeBatchEntries.length === 0` and any `entry.quantity > entry.availableQuantity` conditions, and that `batchError` state is set with the correct Arabic messages; ensure the live fabric cost summary below the batch table is visible whenever `fabricId && fabricColor` are selected (even before any quantities are entered, showing 0 م / 0.00 دج); confirm the amber styling is applied to the fabric cost total in the display line

**Checkpoint**: Batch table validation and live cost display are fully functional in Step 1.

---

## Phase 5: User Story 3 — Consumed Materials with Batch-Level Cost (Priority: P2)

**Goal**: Non-fabric materials can be added in Step 3 with per-batch quantity entry, and their cost flows into the live session cost summary card and into Step 4's total session cost.

**Independent Test**: On Step 3, expand the consumed materials section and add one material item. Select its batches and enter quantities. Verify: (a) the item's cost displays correctly per batch, (b) the cost summary card total updates live, (c) after submitting, the `consumed_materials_cost` on the session record matches, and the `cutting_batch_consumptions` table has one row per batch entered.

*Note: `ConsumedMaterialsEditor.tsx` is already correct. This story's tasks focus on the integration within `CuttingStep3Form.tsx` and the cost card behaviour — both already implemented in T006. The single task here is a verification/finalization pass.*

### Implementation

- [x] T010 [US3] Audit and finalize the consumed materials integration in `frontend/components/cutting/CuttingStep3Form.tsx`: verify `consumedMaterialsCost` is computed via `useMemo` from `materialBatchConsumptions` (same formula as current CuttingStep2Form); verify the cost summary card receives the live `consumedMaterialsCost` and recomputes `totalSessionCost = fabricCost + employeeCost + consumedMaterialsCost` on every change; confirm the count badge on the مواد مستهلكة toggle shows the correct number of added material rows; verify Step 3 passes `consumedMaterialsCost` correctly in `Step3Values` so Step 4 and the submit handler use the right total

**Checkpoint**: Consumed materials flow fully into the cost summary and submission payload.

---

## Phase 6: User Story 4 — Step Validation Guards (Priority: P2)

**Goal**: Each step's Next/Submit button is disabled with the correct validation messages when required fields are missing or invalid.

**Independent Test**: On each step, attempt to advance with deliberately incomplete data and verify: Step 1 blocks without fabric/color/batch/model; Step 2 blocks without employees or with incomplete employee rows; Step 3 blocks without a complete part row; Step 4 blocks when date is empty or cost distribution mismatches.

### Implementation

- [x] T011 [US4] Audit all step validation guards end-to-end: in `CuttingStep1Form.tsx` confirm form schema validation messages are correct and the batch error state is shown below the batch table; in `CuttingStep2Form.tsx` confirm the Zod error messages per employee row (layers/price) are shown inline on the affected row, not just as a generic footer error; in `CuttingStep3Form.tsx` confirm the part row error is shown below the PartRowsEditor with the correct Arabic message; in `CuttingStep4Form.tsx` confirm the date field shows a validation error when empty on submit attempt and the mismatch message text matches the spec exactly: `مجموع تكاليف الأجزاء لا يساوي تكلفة الجلسة`

**Checkpoint**: All 4 step guards enforce their rules with correct Arabic error messages.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T012 [P] Verify RTL layout and `dir="rtl"` is set on all new step components (`CuttingStep2Form.tsx`, `CuttingStep3Form.tsx`, `CuttingStep4Form.tsx`) and that no inline styles are used (replace any with Tailwind utility classes)
- [x] T013 [P] Check all new components use named exports and match the max-150-line guideline where possible; extract any large sub-sections (e.g. employee detail row, cost summary card) into small named sub-components within the same file using local function components if they reduce the main component's line count
- [ ] T014 Run the full end-to-end verification from `specs/019-cutting-session-stepper/quickstart.md` ← manual verification required (`npm run dev:electron`): create a session with 2 employees (different layers/prices), 2 part rows, 1 consumed material with 2 batches; confirm cost distribution auto-initializes; edit one row to lock it; confirm recalculation; submit; verify session appears in list with correct total

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: T001 and T002 can start immediately and run in parallel with each other
- **Phase 2 (Foundational)**: T003 depends on T001 (needs updated `Step1Values` type)
- **Phase 3 (US1)**: T004–T007 all depend on T001+T003; T004/T005/T006/T007 can run in parallel (different files); T008 depends on T004–T007 all being complete
- **Phase 4 (US2)**: T009 depends on T004 (Step1Form refactor)
- **Phase 5 (US3)**: T010 depends on T006 (Step3Form creation)
- **Phase 6 (US4)**: T011 depends on T004–T007 (all step forms exist)
- **Phase 7 (Polish)**: T012–T013 depend on T004–T007; T014 depends on T008

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1+2 — core delivery, must be complete first
- **US2 (P1)**: Depends on T004 (Step1Form) — validation refinement on top of US1 Step1
- **US3 (P2)**: Depends on T006 (Step3Form) — finalization pass on materials integration
- **US4 (P2)**: Depends on T004–T007 (all step forms) — cross-cutting validation audit

### Within Each User Story

- T004, T005, T006, T007 are independently writable (different files) — max parallelism
- T008 is the integration task — must be last in US1
- T009, T010, T011 are finalization/audit tasks on top of their respective step forms

### Parallel Opportunities

- T001 || T002 (types and backend handler — different files)
- T004 || T005 || T006 || T007 (four different step component files — all parallelizable after T003)
- T009 || T010 || T011 (can run after US1 is complete, different files)
- T012 || T013 (polish tasks on different concerns)

---

## Parallel Example: User Story 1

```
After T001 + T003 complete:

  Parallel batch:
    T004: Refactor CuttingStep1Form.tsx (remove employees)
    T005: Rewrite CuttingStep2Form.tsx (per-employee rows)
    T006: Create CuttingStep3Form.tsx (parts + materials + cost card)
    T007: Create CuttingStep4Form.tsx (distribution + notes + date)

  Then sequential:
    T008: Wire all steps in NewCuttingSessionModal.tsx
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — the full usable flow)

1. Complete Phase 1: T001 + T002 (types + backend)
2. Complete Phase 2: T003 (modal skeleton)
3. Complete Phase 3 in parallel: T004 + T005 + T006 + T007, then T008
4. Complete Phase 4: T009 (batch validation finalization)
5. **STOP and VALIDATE**: Run quickstart.md steps 1–8 — full session creation works
6. Ship MVP

### Incremental Delivery

1. T001–T003 → Foundation ready (no visible UI change yet)
2. T004–T008 → Full 4-step flow live (US1 + US2 mostly complete)
3. T009 → Batch over-consumption guard verified (US2 complete)
4. T010 → Materials cost flowing correctly (US3 complete)
5. T011–T013 → Validation polish + RTL + cleanup (US4 complete)
6. T014 → Full E2E validation pass

---

## Notes

- No automated tests — use `quickstart.md` for manual verification steps
- `BatchConsumptionTable.tsx`, `CostDistributionTable.tsx`, `PartRowsEditor.tsx`, `ConsumedMaterialsEditor.tsx` require **zero changes** — do not touch them
- T002 (backend) can be developed and manually tested independently by calling `cutting:create` with a test payload containing `employeeEntries` before any frontend work is done
- The `consumptionRows` legacy field in the payload is derived in the modal's submit handler — it is NOT a Step3Values field
- All monetary computations use `round2(n) = Math.round(n * 100) / 100` — reuse the existing utility from `CostDistributionTable.tsx`
