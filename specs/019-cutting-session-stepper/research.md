# Research: Cutting Session Stepper Redesign & Cost Logic Fix

## Decision 1: Per-employee data representation in the payload

**Decision**: Replace the flat `employeeIds: string[]` + shared `layers: number` + `pricePerLayer: number` in `CreateCuttingSessionPayload` with `employeeEntries: Array<{ employeeId: string; layers: number; pricePerLayer: number }>`.

**Rationale**: Each employee in the new Step 2 has an independently entered layer count and price per layer. The existing flat structure forces all employees to share a single layers+price value. The `employee_operations` table already stores `quantity` (layers) and `price_per_unit` (pricePerLayer) per record — the backend just needs to receive them per-employee.

**Alternatives considered**:
- Keep flat structure and duplicate shared value: rejected — fundamentally cannot represent independent values per employee.
- New separate table for employee session entries: rejected — `employee_operations` already covers this with `source_module='cutting'` and `source_reference_id=sessionId`.

---

## Decision 2: Handle `cutting_sessions.layers` / `price_per_layer` NOT NULL columns

**Decision**: Add a schema migration to make `cutting_sessions.layers` and `cutting_sessions.price_per_layer` nullable (via SQLite `ALTER TABLE … ADD COLUMN` pattern used throughout `main.js`). In the new handler, store `NULL` for both since per-employee data lives in `employee_operations`.

**Rationale**: SQLite `ALTER TABLE` cannot modify column constraints directly. The existing migration pattern in `main.js` adds new columns via `ALTER TABLE … ADD COLUMN`. For existing NOT NULL columns, the standard SQLite approach is to recreate the table. However, given the project avoids Drizzle at runtime, the safest path is: add a try/catch migration that sets a default of 0 for legacy rows while allowing new rows to use NULL via the already-nullable pattern in `main.js` (other nullable fields exist).

Actually, SQLite does allow inserting `NULL` into NOT NULL columns only if there is a DEFAULT. The cleanest safe approach: keep `layers` and `price_per_layer` as 0 (store 0) for new multi-employee sessions. This avoids any DDL migration risk while preserving backward compatibility for the detail view.

**Revised Decision**: For multi-employee sessions, store `layers = 0` and `price_per_layer = 0` in `cutting_sessions`. The `employee_cost` field in `cutting_sessions` carries the authoritative cost; `layers`/`price_per_layer` become legacy display fields that show 0 for new sessions.

**Alternatives considered**:
- Full table recreation migration: rejected — too risky for production SQLite data without Drizzle migrations.
- Store first employee's values: rejected — misleading for multi-employee sessions.

---

## Decision 3: Step 3 cost summary card — pinned vs. inline

**Decision**: The session cost summary card in Step 3 is rendered as a sticky element pinned above the footer (using `sticky bottom-[footer-height]` or absolute positioning inside the modal's scroll container), not as an inline section at the bottom of the scroll area.

**Rationale**: The user description specifies "pinned at the bottom of step 3 above the footer." The AppModal component uses a sticky footer. The cost summary card sits between the scrollable step content and the sticky footer — this is achievable by placing the card outside the scrollable region but inside the modal layout.

**Alternatives considered**:
- Inline at bottom of scroll: rejected — user loses sight of costs while scrolling parts/materials.
- Fixed to viewport: rejected — AppModal is a dialog, not full-screen.

---

## Decision 4: Cost distribution recalculation trigger

**Decision**: Recalculation of "تلقائي" rows fires on every `onChange` event of any unit cost input (i.e., on every keystroke), not on blur/commit.

**Rationale**: The user description specifies "recalculation fires on every keystroke in any unit cost field." The existing `CostDistributionTable` already does this via `handleUnitCostChange`. No change needed to the recalculation logic — only the step placement changes.

**Alternatives considered**:
- On-blur recalculation: rejected — spec explicitly states on every keystroke.

---

## Decision 5: Step 3 → Step 4 data handoff

**Decision**: Step 3 emits `{ parts, materialBatchConsumptions, consumedMaterialsCost }`. The modal stores this as `step3Data`. Step 4 receives `totalSessionCost` (computed in modal from step1+step2+step3 costs) and `parts` to initialize the distribution table.

**Rationale**: Following the existing pattern where step data is accumulated in modal state and passed down as props. The cost summary card in Step 3 reads fabric/employee costs from step1/step2 data held in modal state. The distribution table in Step 4 is pre-populated from `step3Data.parts`.

---

## Decision 6: Component size compliance

**Decision**: New Step 2 (employee rows) and Step 4 (cost distribution + notes + date) components will exceed the constitution's 150-line limit due to their inherent complexity. This is documented as a justified exception in the Complexity Tracking section of the plan.

**Rationale**: The employee rows component needs to manage checkbox state, per-employee form state (Zod per-row), and the total cost footer. The Step 4 component embeds the CostDistributionTable, notes textarea, date picker, and submit logic. Both are too complex to split further without introducing unnecessary prop-drilling (also prohibited by constitution at >3 levels).

**Alternatives considered**:
- Split into sub-components: the sub-components would each be trivially small and would require prop drilling or a Zustand store specifically for stepper transient state — both worse than a slightly over-limit component.

---

## Decision 7: useEffect usage for data fetching

**Decision**: Follow the existing codebase pattern of using `useEffect` for initial data loads (fabrics, employees, non-fabric items) within step components. This is an existing constitution violation present throughout the cutting module that is out of scope for this redesign.

**Rationale**: Extracting all IPC calls into dedicated hooks for every data source in the stepper would be a significant refactoring effort orthogonal to the feature goal. The existing `useFabricBatches` hook exists as a model; future refactoring should migrate other calls similarly.

---

## Decision 8: `consumptionRows` legacy field in payload

**Decision**: Keep the `consumptionRows: ConsumptionRow[]` field in `CreateCuttingSessionPayload` for backward compatibility with the backend handler's stock_transactions insertion logic (step 4b in the handler). This is derived from `materialBatchConsumptions` in the modal before submission, identical to the current pattern.

**Rationale**: The backend handler uses `consumptionRows` to insert into `cutting_consumption_entries` and `stock_transactions`. Removing this would require a backend refactor beyond the scope of this stepper redesign. The derivation (`materialBatchConsumptions.map(mc => ({ stockItemId, color, quantity: sum of batches }))`) remains in the modal's submit handler.
