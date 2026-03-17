# Tasks: Models, Pieces & Platform-Wide Relational Consistency

**Input**: Design documents from `/specs/009-models-parts-consistency/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ipc-channels.md ✓, quickstart.md ✓

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US5)

---

## Phase 1: Setup (Reference Schemas & Types)

**Purpose**: Create Drizzle reference schemas for new tables and update schema/type files for modified tables. These are documentation artifacts; they do not block runtime behavior but should exist before implementation.

- [X] T001 [P] Create Drizzle reference schema for `models` table in `electron/db/schema/model.ts` — fields: id TEXT PK, name TEXT NOT NULL, is_predefined INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at INTEGER, updated_at INTEGER
- [X] T002 [P] Create Drizzle reference schema for `parts` table in `electron/db/schema/part.ts` — same structure as model.ts
- [X] T003 [P] Create Drizzle reference schema for `sizes` table in `electron/db/schema/size.ts` — same structure as model.ts
- [X] T004 [P] Update `electron/db/schema/cutting_piece.ts` — add reference columns `part_name: text('part_name')` and `color: text('color')` (nullable)
- [X] T005 [P] Update `electron/db/schema/employee_operation.ts` — add reference columns `model_name: text('model_name')`, `part_name: text('part_name')`, `color: text('color')` (all nullable)
- [X] T006 [P] Update `electron/db/schema/stock_transaction.ts` — add reference column `model_name: text('model_name')` (nullable)
- [X] T007 [P] Update `frontend/features/lookups/lookups.types.ts` — add `ModelEntry`, `PartEntry`, `SizeEntry` interfaces each with `{ id: string; name: string; isPredefined: boolean }`

---

## Phase 2: Foundational (DB + IPC + Hook Infrastructure)

**Purpose**: All user story phases depend on this infrastructure. MUST complete before Phase 3+.

**⚠️ CRITICAL**: No user story implementation can begin until T008–T012 are complete.

- [X] T008 Add DB schema creation and migrations to `electron/main.js` — in the DB init block: CREATE TABLE IF NOT EXISTS for `models`, `parts`, `sizes` (same DDL as colors/item_types/units); then try/catch ALTER TABLE statements to add `part_name` and `color` to `cutting_pieces`, `model_name`+`part_name`+`color` to `employee_operations`, and `model_name` to `stock_transactions`
- [X] T009 Add 12 IPC handlers for models/parts/sizes CRUD inside `registerIpcHandlers()` in `electron/main.js` — handlers: `lookups:getModels`, `lookups:createModel`, `lookups:updateModel`, `lookups:deleteModel`, `lookups:getParts`, `lookups:createPart`, `lookups:updatePart`, `lookups:deletePart`, `lookups:getSizes`, `lookups:createSize`, `lookups:updateSize`, `lookups:deleteSize` — follow exact same pattern as existing `lookups:getColors`, `lookups:createColor`, etc. with case-insensitive duplicate check and is_predefined guard
- [X] T010 Expose new channels in `electron/preload.js` — add `getModels`, `createModel`, `updateModel`, `deleteModel`, `getParts`, `createPart`, `updatePart`, `deletePart`, `getSizes`, `createSize`, `updateSize`, `deleteSize` under the existing `lookups` namespace
- [X] T011 Add typed IPC wrappers for all 12 new channels in `frontend/lib/ipc-client.ts` — extend the existing `lookups` object with `getModels`, `createModel`, `updateModel`, `deleteModel`, `getParts`, `createPart`, `updatePart`, `deletePart`, `getSizes`, `createSize`, `updateSize`, `deleteSize`; also declare the new methods on the `Window['ipcBridge']['lookups']` type (likely in `frontend/features/auth/auth.types.ts` or wherever the ipcBridge window type is declared)
- [X] T012 Update `frontend/hooks/useLookups.ts` — add `models`, `parts`, `sizes` state arrays fetched via `ipcClient.lookups.getModels/getParts/getSizes`; expose `createModel`, `updateModel`, `deleteModel`, `createPart`, `updatePart`, `deletePart`, `createSize`, `updateSize`, `deleteSize` mutation methods following the same pattern as existing color/type/unit methods

**Checkpoint**: Lookup infrastructure complete — models/parts/sizes can now be created, fetched, and managed via IPC.

---

## Phase 3: User Story 1 — Managed Models, Sizes & Parts in Settings (P1)

**Goal**: Settings screen gains three new managed list sections for Models, Parts, and Sizes, following the exact same pattern as Colors, Types, and Units.

**Independent Test**: Open Settings, add model "حجاب", part "الضهر", size "S". All three appear in their lists. Open cutting session form and confirm all three appear in their respective dropdowns without a page refresh.

- [X] T013 [US1] Add Models management section to `frontend/app/(dashboard)/settings/page.tsx` — add a new `LookupSection` block for models using `useLookups` models data and mutation methods; section title "الموديلات", add label "إضافة موديل", edit label "تعديل الموديل", delete confirmation in Arabic — follow exact same structure as Colors/Types/Units sections in the same file
- [X] T014 [US1] Add Parts management section to `frontend/app/(dashboard)/settings/page.tsx` — same as T013 but for parts; title "القطع", add label "إضافة قطعة"
- [X] T015 [US1] Add Sizes management section to `frontend/app/(dashboard)/settings/page.tsx` — same as T013 but for sizes; title "المقاسات", add label "إضافة مقاس"

---

## Phase 4: User Story 2 — Cutting Step 2 Structured Part+Size Rows (P2)

**Goal**: Cutting Step 2 replaces free-text size rows with structured part+size selects. Each piece record stores model, part, size, color, and status.

**Independent Test**: Create cutting session for model "حجاب". Step 2: add rows "الضهر/S/30" and "الأمام/M/20". Submit. Verify 50 pieces in DB each with part_name, size_label, color set.

- [X] T016 [P] [US2] Create `frontend/components/cutting/PartSizeRowsEditor.tsx` — row list component where each row has: part `ManagedDropdown` (items from `useLookups` parts, `addLabel="إضافة قطعة"`, `onAddNew` calls `createPart`), size `ManagedDropdown` (items from `useLookups` sizes, `addLabel="إضافة مقاس"`, `onAddNew` calls `createSize`), quantity number input (min 1); rows can be added/removed; minimum 1 row validation; total quantity displayed; accepts `onPartsRefetch` and `onSizesRefetch` callbacks for after inline-add
- [X] T017 [P] [US2] Update `frontend/components/cutting/CuttingStep1Form.tsx` — replace the model_name text input with `ManagedDropdown` (items from `useLookups` models, `addLabel="إضافة موديل"`, `onAddNew` calls `ipcClient.lookups.createModel` then refetches models list); update Zod schema if needed to keep `modelName` as required string
- [X] T018 [US2] Update `frontend/components/cutting/CuttingStep2Form.tsx` — replace `SizeRowsEditor` with `PartSizeRowsEditor`; update the form's Zod schema so `pieceRows` is `Array<{ partName: string; sizeName: string; quantity: number }>` (replacing old `sizeRows: Array<{ sizeLabel: string; pieceCount: number }>`); pass `parts` and `sizes` from `useLookups` into `PartSizeRowsEditor`
- [X] T019 [US2] Update `cutting:create` IPC handler in `electron/main.js` — accept `pieceRows[]{partName, sizeName, quantity}` instead of `sizeRows[]{sizeLabel, pieceCount}`; for each pieceRow insert `quantity` cutting_pieces rows each storing `part_name = partName`, `size_label = sizeName`, `color = fabricColor`; when employeeId is provided, insert one `employee_operations` row per pieceRow storing `model_name`, `part_name`, `color`, `quantity`, `price_per_unit`; validate at least one pieceRow exists

---

## Phase 5: User Story 3 — Platform-Wide Select Consistency (P3)

**Goal**: All managed-list fields across all forms become ManagedDropdown selects. No free-text entry for managed-list data remains.

**Independent Test**: Add employee "Fatima". Without refreshing, open cutting form — Fatima appears in employee selector. Verify distribution batch form has model and size as selects (not text inputs).

- [X] T020 [US3] Update the distribution batch creation form component (find in `frontend/components/distribution/`) — replace `model_name` text input with `ManagedDropdown` from models list; replace `size_label` text input with `ManagedDropdown` from sizes list; both with inline-add support (`addLabel="إضافة موديل"` / `"إضافة مقاس"`) and `onAddNew` that calls the respective create IPC channel and refetches
- [X] T021 [US3] Update `frontend/components/qc/AddQcRecordModal.tsx` — if a model_name text field exists, replace it with `ManagedDropdown` from models list with inline-add support; ensure employee select already uses live employee list from IPC (verify it is not a text field)
- [X] T022 [US3] Update `frontend/components/finition/AddFinitionRecordModal.tsx` — same as T021: replace any model_name text field with `ManagedDropdown`; verify employee select is IPC-backed
- [X] T023 [US3] Update `frontend/components/finition/AddToStockModal.tsx` — ensure model_name and size_label fields use `ManagedDropdown` (not text inputs) since `final_stock_entries` stores both; add inline-add support

---

## Phase 6: User Story 4 — Employee Operation Traceability (P4)

**Goal**: Employee detail shows per-operation context (model/part/color) and each row is clickable to navigate to the source record.

**Independent Test**: Log a cutting operation for "Ahmed" (model حجاب, part الضهر, size S, qty 30, price 5دج). Open Ahmed's detail. Verify row shows full context. Click row — navigates to cutting session.

- [X] T024 [US4] Update employee operations queries in `electron/main.js` (look for `employees:getById` or `employees:getOperations` handler) — include `model_name`, `part_name`, `color` columns in the SELECT for operation rows; ensure `source_reference_id` and `operation_type` are also returned (they already exist in the schema)
- [X] T025 [P] [US4] Update `frontend/features/employees/employees.types.ts` — add `modelName?: string`, `partName?: string`, `color?: string` fields to the `OperationRecord` interface (or equivalent operation line-item type)
- [X] T026 [US4] Update `frontend/components/employees/OperationsHistory.tsx` — add columns for model, part (if not null), color in the operations table; make each operation row a clickable element (`cursor-pointer`, `hover:bg-gray-50` on `tr`) that calls an `onNavigate(operationType, sourceReferenceId)` prop; display `—` when part/color not available (non-cutting operations)
- [X] T027 [US4] Update the employee detail page or parent component that renders `OperationsHistory` (find in `frontend/app/(dashboard)/employees/` or `frontend/components/employees/EmployeeDetailPanel.tsx`) — implement `handleNavigate(operationType, sourceReferenceId)` using `router.push()` to route: `cutting` → `/cutting/{id}`, `distribution` → `/distribution/{id}`, `qc` → `/qc/{id}`, `finition` → `/qc/{id}` (finition tab); pass handler to `OperationsHistory` as `onNavigate` prop; skip navigation for `custom` type (no sourceReferenceId)

---

## Phase 7: User Story 5 — Stock Consumption Traceability (P5)

**Goal**: Stock transaction history shows model_name for all consumed entries, with source context already present via source_module + source_reference_id.

**Independent Test**: Consume 2m fabric in cutting session for model "حجاب". Open fabric stock detail → transaction row shows "استهلاك — قص — حجاب — [date]".

- [X] T028 [US5] Update all handlers in `electron/main.js` that insert `stock_transactions` rows with `type = 'consumed'` — specifically: the fabric consumption insert in `cutting:create`, and any consumption inserts in `qc:create`, `finition:create`, `finition:createStep` — add `model_name` to each INSERT statement, sourcing it from the session/record's `model_name` field
- [X] T029 [P] [US5] Update `frontend/features/stock/stock.types.ts` — add `modelName?: string` to the `StockTransaction` interface (or equivalent consumed transaction type used by `TransactionHistory`)
- [X] T030 [US5] Update `frontend/components/stock/TransactionHistory.tsx` — for rows where `type === 'consumed'` and `modelName` is present, display model name in a new column or as additional context within the existing row; e.g., append `— {modelName}` after the source module label

---

## Final Phase: Polish & Verification

- [ ] T031 Manual QA against all 8 scenarios in `specs/009-models-parts-consistency/quickstart.md` — verify: settings sections appear (S1), inline-add from cutting form (S2), multi-row cutting session totals (S3), real-time employee selector (S4), employee operations traceability with navigation (S5), stock consumption model context (S6), soft-delete hides from selectors (S7), duplicate inline-add error (S8)

---

## Dependencies

```
Phase 1 (T001–T007) ──► Phase 2 (T008–T012) ──► Phase 3 (T013–T015) [US1]
                                                ├──► Phase 4 (T016–T019) [US2, depends on US1 selectors]
                                                ├──► Phase 5 (T020–T023) [US3, depends on US1 lists]
                                                ├──► Phase 6 (T024–T027) [US4, depends on US2 cutting:create]
                                                └──► Phase 7 (T028–T030) [US5, depends on Phase 2 migrations]
```

- US1 (Phase 3) must complete before US2/US3 can fully test inline-add
- US2 (Phase 4) `cutting:create` update (T019) is prerequisite for US4 T024 (employee operation context)
- All phases depend on Phase 2 (DB migrations + IPC channels)
- Phase 1 tasks (T001–T007) are all parallelizable

---

## Parallel Execution Examples

**Phase 1** — All 7 tasks can run in parallel (different files):
`T001 + T002 + T003 + T004 + T005 + T006 + T007`

**Phase 4** — T016 and T017 can run in parallel (different files):
`T016 (PartSizeRowsEditor.tsx) + T017 (CuttingStep1Form.tsx)` → then T018 → then T019

**Phase 6** — T025 can run in parallel with T024:
`T024 (main.js queries) + T025 (types)` → then T026 → then T027

**Phase 7** — T029 can run in parallel with T028:
`T028 (main.js inserts) + T029 (types)` → then T030

---

## Implementation Strategy

**MVP (minimum valuable product)**: Complete Phase 1 + Phase 2 + Phase 3 (US1 only)
→ Delivers: Managers can add/edit/soft-delete models, parts, and sizes from Settings. All dropdowns are ready for subsequent phases.

**Increment 2**: Add Phase 4 (US2 — Cutting Step 2 restructure)
→ Delivers: Cutting sessions now store structured part+size data per piece.

**Increment 3**: Add Phase 5 (US3 — Platform-wide consistency)
→ Delivers: All forms use managed-list selects; no free-text model/size fields remain.

**Full delivery**: Add Phases 6 + 7 (US4 + US5)
→ Delivers: Full traceability — employee operations drillable to source; stock consumed transactions show model context.
