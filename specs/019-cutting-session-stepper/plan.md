# Implementation Plan: Cutting Session Stepper Redesign & Cost Logic Fix

**Branch**: `019-cutting-session-stepper` | **Date**: 2026-04-02 | **Spec**: [spec.md](./spec.md)

## Summary

Redesign the cutting session creation modal from a 2-step flow (معلومات القص → الأجزاء والمواد) into a 4-step flow (القماش والموديل → الموظفون والطبقات → الأجزاء والمواد → التوزيع والملاحظات). The key functional change is per-employee independent layers + price per layer inputs replacing the current shared single-value fields. The existing cost distribution algorithm and batch consumption tables are preserved and redistributed across the new steps. The `CreateCuttingSessionPayload` type and the `cutting:create` IPC handler are updated to accept `employeeEntries[]` instead of flat `employeeIds[]` + shared `layers`/`pricePerLayer`.

## Technical Context

**Language/Version**: TypeScript 5 (strict, frontend renderer) + Node.js plain JavaScript (Electron main process)
**Primary Dependencies**: Next.js 16 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod 4, Tailwind CSS 4, Lucide React, shadcn/ui
**Storage**: SQLite via better-sqlite3 plain prepared statements in `electron/main.js`; no new tables required
**Testing**: Manual UI + IPC integration testing (no automated test framework in use)
**Target Platform**: Desktop (macOS/Windows via Electron 41)
**Project Type**: Desktop application (Electron + Next.js renderer)
**Performance Goals**: Cost distribution recalculation on every keystroke with no perceptible lag (<50ms)
**Constraints**: RTL layout (Arabic), strict TypeScript, no Drizzle at runtime, SQLite atomicity via `db.transaction()`
**Scale/Scope**: Single-user desktop app; one session creation at a time

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Core Data Flow Architecture (Page → Hook → ipc-client → handler → service → queries) | ⚠ Partial | Existing cutting components call `ipcClient` directly inside components via `useEffect` — this is a pre-existing deviation. New components follow the same pattern for consistency. `useFabricBatches` hook exists as the correct model; full hook extraction is out of scope. |
| Component & Page Discipline (max 150 lines, named exports, no inline styles) | ⚠ Partial | Step 2 and Step 4 components will exceed 150 lines due to inherent complexity (see Complexity Tracking). Named exports used. Inline styles minimized. |
| Type Safety & Data Integrity (strict TS, Zod validation, typed IPC) | ✅ Pass | All new types added, Zod schema for Step 2, no `any`. |
| RTL & Localization First (dir="rtl", no hardcoded strings) | ✅ Pass | All components use `dir="rtl"`. All strings externalized per existing pattern. |
| UI/UX Consistency (skeleton loaders, error states, disabled buttons, toasts) | ✅ Pass | Loading/error states preserved from existing components. |
| NEVER use useEffect for data fetching | ⚠ Pre-existing | Existing violation carried forward. Not introduced new. |
| NEVER use prop drilling beyond 3 levels | ✅ Pass | Modal → StepForm → sub-component (2 levels max). |
| NEVER create forms without Zod validation | ✅ Pass | Step 2 uses per-employee Zod validation. Step 4 uses existing CostDistributionTable (no form, validated by distribution logic). |

## Project Structure

### Documentation (this feature)

```text
specs/019-cutting-session-stepper/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ipc-cutting-create.md    ← updated IPC contract
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
frontend/
  components/cutting/
    NewCuttingSessionModal.tsx     REFACTOR   2-step → 4-step orchestrator
    CuttingStep1Form.tsx           REFACTOR   remove employee section; keep fabric+batch+model
    CuttingStep2Form.tsx           REWRITE    new: employee checkboxes + per-employee rows
    CuttingStep3Form.tsx           NEW        parts editor + consumed materials + cost card
    CuttingStep4Form.tsx           NEW        cost distribution + notes + date + submit
    CostDistributionTable.tsx      KEEP       no logic changes; receives step3 parts
    BatchConsumptionTable.tsx      KEEP       no changes
    PartRowsEditor.tsx             KEEP       no changes
  components/shared/
    ConsumedMaterialsEditor.tsx    KEEP       no changes
  features/cutting/
    cutting.types.ts               UPDATE     add EmployeeEntry; update CreateCuttingSessionPayload

electron/
  main.js                          UPDATE     cutting:create handler: employeeEntries[]
```

**Structure Decision**: Electron + Next.js desktop app (Option 2 variant). Frontend in `frontend/`, main process in `electron/`. No new directories required.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| CuttingStep2Form > 150 lines | Employee checkbox list + per-employee Zod form state + independent row expansion + total cost footer all in one component | Splitting into EmployeeCheckboxList + EmployeeDetailRow requires 3+ prop levels and a Zustand store for transient step state — both worse |
| CuttingStep4Form > 150 lines | Embeds CostDistributionTable + notes textarea + date picker + submit logic + error display | Each sub-unit is too small to justify its own file; distribution table is already its own component |
| useEffect for data fetching (Steps 1, 2, 3) | Consistent with existing module pattern; full hook extraction is orthogonal to this feature | Creating 5+ new hooks (useFabrics, useEmployees, useLookupColors, useLookupModels, useNonFabricItems) doubles the file count for this feature without shipping user value |

---

## Phase 0: Research Summary

All research decisions resolved in [research.md](./research.md). No NEEDS CLARIFICATION markers remain.

Key decisions:
1. `employeeEntries[]` replaces flat employee fields in payload
2. `cutting_sessions.layers = 0`, `price_per_layer = 0` for new sessions (no DDL migration)
3. Cost card in Step 3 is sticky above the modal footer
4. Recalculation on every keystroke (existing behavior, no change)
5. `consumptionRows` legacy field retained for backward-compatible backend insert logic

---

## Phase 1: Design

### Step 1 — Refactor `CuttingStep1Form.tsx`

**Remove**: employees section (checkboxes, layers input, pricePerLayer input, employeeCost display), date picker, notes field, total session cost summary card.

**Keep**: fabric select, color select (disabled until fabric selected), `BatchConsumptionTable` (appears on fabric+color selection), model select (ManagedDropdown with inline-add), live fabric cost line below batch table.

**Emit (`Step1Values`)**:
```typescript
{
  fabricItemId: string
  fabricColor: string
  modelName: string
  availableMeters: number
  metersUsed: number
  fabricBatchEntries: FabricBatchEntry[]
  fabricCost: number
}
```

**Validation guard**: Next button disabled until fabric selected, color selected, at least one batch entry with quantity > 0 and no overdraw, model selected.

---

### Step 2 — Rewrite `CuttingStep2Form.tsx`

**Layout**:
- Top section: scrollable checkbox list of active employees (loaded from `ipcClient.employees.getAll()` filtered to `status === 'active'`)
- Below checkboxes: for each checked employee, an expanded detail row:
  - Employee name (right, read-only label)
  - Layers input (number, required, min 1, controlled)
  - Price per layer input (number, required, min 0.01, step any, controlled)
  - Total cost display (read-only, layers × pricePerLayer)
- Footer: total employee cost = sum of all row totals

**State**:
```typescript
type EmployeeRowState = {
  employeeId: string
  name: string
  checked: boolean
  layers: string          // string for input control
  pricePerLayer: string   // string for input control
}
```

**Zod schema** (per-employee, validated on Next click):
```typescript
z.object({
  employees: z.array(z.object({
    employeeId: z.string(),
    layers: z.coerce.number().int().min(1),
    pricePerLayer: z.coerce.number().positive(),
  })).min(1, 'اختر موظفاً واحداً على الأقل'),
})
```

**Emit (`Step2Values`)**:
```typescript
{
  employeeEntries: Array<{ employeeId: string; layers: number; pricePerLayer: number }>
  employeeCost: number   // sum of (layers × pricePerLayer)
}
```

**Validation guard**: Next disabled until at least one employee checked and all checked employees have layers > 0 and pricePerLayer > 0.

---

### Step 3 — New `CuttingStep3Form.tsx`

**Layout**:
- Produced parts section (top): `<PartRowsEditor>` (existing component, no changes)
- Consumed materials section (below parts): `<ConsumedMaterialsEditor>` (existing component, no changes), collapsed by default with count badge
- Pinned cost summary card (above modal footer): 4 lines — fabric cost, employee cost, materials cost, total; amber bold on total

**Props received**:
```typescript
{
  fabricCost: number           // from step1Data
  employeeCost: number         // from step2Data
  modelName: string            // from step1Data (for part suggestions)
  onNext: (values: Step3Values) => void
  onBack: () => void
  nonFabricItems: NonFabricItem[]   // loaded once in modal and passed down
}
```

**Emit (`Step3Values`)**:
```typescript
{
  parts: PartRow[]
  materialBatchConsumptions: MaterialBatchConsumption[]
  consumedMaterialsCost: number
}
```

**Validation guard**: Next disabled until at least one PartRow has partName, sizeLabel, and count ≥ 1 all filled.

**Cost summary card positioning**: Rendered outside the scrollable content div, between the scroll area and the sticky footer inside AppModal. Achievable by lifting the card to the modal's content area footer slot (or using `sticky bottom-0` within the step container with the scroll container having overflow-auto).

---

### Step 4 — New `CuttingStep4Form.tsx`

**Layout**:
- Read-only cost summary (top, identical to Step 3 card but frozen, no amber — standard text)
- `<CostDistributionTable>` (existing component, receives `parts` from step3Data and `totalSessionCost` from modal)
- Below table: notes (textarea, optional) + date picker (required, defaults to today) — side by side on desktop, stacked on mobile
- Footer: السابق (right), إنشاء الجلسة (left, disabled when hasCostMismatch)

**Props received**:
```typescript
{
  fabricCost: number
  employeeCost: number
  consumedMaterialsCost: number
  totalSessionCost: number
  parts: PartRow[]
  isSubmitting: boolean
  submitError: string | null
  onSubmit: (values: Step4Values) => void
  onBack: () => void
}
```

**State**: `costDistributionRows`, `partCosts`, `date` (string, default today), `notes` (string)

**Emit (`Step4Values`)**:
```typescript
{
  partCosts: PartCost[]
  sessionDate: string   // ISO date string
  notes?: string
}
```

**Submit guard**: Disabled when `hasCostMismatch` (all rows locked and grand total ≠ totalSessionCost) OR `isSubmitting` OR date empty.

---

### Modal Orchestrator — Refactor `NewCuttingSessionModal.tsx`

**State**:
```typescript
step: 1 | 2 | 3 | 4
step1Data: Step1Values | null
step2Data: Step2Values | null
step3Data: Step3Values | null
isSubmitting: boolean
submitError: string | null
```

**Computed**:
```typescript
totalSessionCost = (step1Data?.fabricCost ?? 0)
                 + (step2Data?.employeeCost ?? 0)
                 + (step3Data?.consumedMaterialsCost ?? 0)
```

**Step indicator labels**: `['القماش والموديل', 'الموظفون والطبقات', 'الأجزاء والمواد', 'التوزيع والملاحظات']`

**Submit handler** builds `CreateCuttingSessionPayload`:
```typescript
{
  ...step1Data (fabricItemId, fabricColor, modelName, metersUsed, fabricBatchConsumptions, fabricCost),
  employeeEntries: step2Data.employeeEntries,
  employeeCost: step2Data.employeeCost,
  parts: step3Data.parts,
  consumptionRows: step3Data.materialBatchConsumptions.map(mc => ({ stockItemId: mc.stockItemId, color: mc.color, quantity: mc.batches.reduce((s,b) => s + b.quantity, 0) })),
  materialBatchConsumptions: step3Data.materialBatchConsumptions,
  consumedMaterialsCost: step3Data.consumedMaterialsCost,
  partCosts: step4Values.partCosts,
  sessionDate: new Date(step4Values.sessionDate).getTime(),
  notes: step4Values.notes,
  totalSessionCost,
}
```

**Non-fabric items loading**: Load once in modal (`useEffect` on mount) and pass to Step 3 as prop — avoids redundant IPC calls on step navigation.

---

### Types — Update `cutting.types.ts`

Add:
```typescript
export interface EmployeeEntry {
  employeeId: string;
  layers: number;
  pricePerLayer: number;
}
```

Update `CreateCuttingSessionPayload`: remove `employeeIds`, `layers`, `pricePerLayer`; add `employeeEntries: EmployeeEntry[]`, `employeeCost: number`.

---

### Backend — Update `cutting:create` in `electron/main.js`

1. Destructure `employeeEntries` (instead of `employeeIds`, `layers`, `pricePerLayer`).
2. Derive `const employeeIds = employeeEntries.map(e => e.employeeId)` for the employee validation loop.
3. `cutting_sessions` INSERT: set `layers = 0, price_per_layer = 0` (multi-employee sessions do not have a single representative value).
4. Employee operations INSERT loop: iterate `employeeEntries`, use `entry.layers`, `entry.pricePerLayer`, `entry.layers * entry.pricePerLayer` for each row.
5. Return `totalCost: totalSessionCost ?? employeeCost` (no longer `earnings * employeeIds.length`).

---

## Phase 1 Re-check: Constitution

| Principle | Post-Design Status |
|-----------|-------------------|
| Core Data Flow | ⚠ Same as before — pre-existing deviation |
| 150-line limit | ⚠ Justified exceptions in Complexity Tracking |
| Type safety | ✅ All new types defined, Zod schemas for Step 2 |
| RTL / localization | ✅ dir="rtl" on all new components |
| UI/UX consistency | ✅ Loading/error/disabled states in all steps |
| No prop drilling >3 | ✅ Modal → StepForm → sub-component max |
