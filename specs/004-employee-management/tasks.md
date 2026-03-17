# Tasks: Employee Management

**Input**: Design documents from `/specs/004-employee-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ipc-channels.md ✅, quickstart.md ✅

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure for new employee feature

- [X] T001 Create `frontend/features/employees/` and `frontend/components/employees/` directories (mkdir stubs)
- [X] T002 Create `frontend/app/(dashboard)/employees/` page directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Drizzle DB schemas, SQLite migrations, preload namespace, and TypeScript types — MUST be complete before any user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Create `electron/db/schema/employee.ts` — Drizzle `employees` table schema (id, name, phone, role, notes, photo_path, status DEFAULT 'active', created_at, updated_at) with `type Employee` and `type NewEmployee` exports
- [X] T004 [P] Create `electron/db/schema/employee_operation.ts` — Drizzle `employee_operations` table schema (id, employee_id FK, operation_type, source_module nullable, source_reference_id nullable, operation_date, quantity REAL CHECK>0, price_per_unit REAL CHECK>=0, total_amount REAL, notes, created_at, updated_at) with type exports
- [X] T005 [P] Create `electron/db/schema/employee_payment.ts` — Drizzle `employee_payments` table schema (id, employee_id FK, amount REAL CHECK>0, payment_date, notes, created_at, updated_at) with type exports
- [X] T006 Add three schema imports to schema spread in `electron/db/index.ts` and append CREATE TABLE IF NOT EXISTS migrations for `employees`, `employee_operations`, `employee_payments` plus three indexes (`idx_employees_status`, `idx_employee_ops_employee_date`, `idx_employee_payments_employee_date`) to `runMigrations()`
- [X] T007 [P] Add `employees` namespace to `electron/preload/index.ts` — 9 channels via `ipcRenderer.invoke`: getAll, getById, create, update, setStatus, addOperation, addPayment, updatePayment, deletePayment
- [X] T008 [P] Create `frontend/features/employees/employees.types.ts` — export `EmployeeStatus`, `OperationType`, `EmployeeSummary`, `OperationRecord`, `OperationGroup`, `PaymentRecord`, `EmployeeDetail`, `CreateEmployeePayload`, `UpdateEmployeePayload`, `SetStatusPayload`, `AddOperationPayload`, `AddPaymentPayload`, `UpdatePaymentPayload`
- [X] T009 Add `employees` namespace to `frontend/lib/ipc-client.ts` with 9 typed methods importing from `@/features/employees/employees.types` — getAll, getById, create, update, setStatus, addOperation, addPayment, updatePayment, deletePayment

**Checkpoint**: DB schema ready, IPC bridge wired, all TypeScript types defined — user story implementation can begin

---

## Phase 3: User Story 1 — Manage Employee Directory (Priority: P1) 🎯 MVP

**Goal**: Users can view, add, edit, deactivate, and re-activate employees from a dedicated sidebar section. Table shows photo thumbnail, name, role, phone, balance due, and status badge.

**Independent Test**: Navigate to الموظفون → add two employees (one with photo) → edit one → deactivate the other → re-activate them → confirm empty state, table rows, status badges, toasts, and confirmation dialog all work correctly (quickstart Steps 1–8)

### Implementation for User Story 1

- [X] T010 [US1] Create `electron/features/employees/employees.queries.ts` — implement `getAllEmployees()` (SELECT with balance_due subqueries: SUM(employee_operations.total_amount) − SUM(employee_payments.amount), ordered by name ASC), `insertEmployee(data)`, `updateEmployeeById(id, data)`, `setEmployeeStatus(id, status)`
- [X] T011 [US1] Create `electron/features/employees/employees.service.ts` — implement photo helpers (`getPhotosDir()` → `userData/employee-photos/`, `savePhoto(base64, mimeType)`, `deletePhoto(filename)`, `resolvePhotoPath(filename|null)`); implement `getAll()` mapping to `EmployeeSummary[]`, `createEmployee(payload)`, `updateEmployee(payload)`, `setStatus(payload)`; validate name non-empty, photo ≤ 5 MB and JPG/PNG/WEBP only
- [X] T012 [US1] Create `electron/ipc/employees.handler.ts` — `registerEmployeesHandlers()` registers `employees:getAll`, `employees:create`, `employees:update`, `employees:setStatus` handlers; each returns `{success:true,data}|{success:false,error}`
- [X] T013 [US1] Import `registerEmployeesHandlers` and call it in `electron/main/index.ts`
- [X] T014 [P] [US1] Create `frontend/hooks/useEmployeeList.ts` — `useCallback` + `useEffect`; calls `ipcClient.employees.getAll()`; exposes `employees: EmployeeSummary[]`, `loading`, `error`, `refetch`
- [X] T015 [P] [US1] Create `frontend/components/employees/EmployeeTableRow.tsx` — row with photo thumbnail (or placeholder avatar), name, role, phone, balance due (red if negative), status badge ("نشط"/"غير نشط"); edit button (Pencil icon); deactivate button (shows "تعطيل" when active, "تفعيل" when inactive); stop click propagation on action buttons
- [X] T016 [US1] Create `frontend/components/employees/EmployeeTable.tsx` — search input filtering by name/role; EmptyState when no employees; renders `EmployeeTableRow` list; accepts `employees`, `onRowClick`, `onEdit`, `onSetStatus` props
- [X] T017 [US1] Create `frontend/components/employees/AddEmployeeModal.tsx` — react-hook-form + Zod; fields: name (required, non-empty), phone, role, notes, photo (file input, JPG/PNG/WEBP, max 5 MB); reads file as base64 before submitting; calls `ipcClient.employees.create`; shows toast on success
- [X] T018 [US1] Create `frontend/components/employees/EditEmployeeModal.tsx` — same fields pre-filled from `employee` prop; photo shows current thumbnail with "إزالة الصورة" option (sets `photoData: null`); calls `ipcClient.employees.update`; shows toast on success
- [X] T019 [US1] Create `frontend/app/(dashboard)/employees/page.tsx` — Suspense wrapper around `EmployeesPageContent`; reads `?id=` search param; when no id: renders `EmployeeTable` + AddEmployeeModal trigger + EditEmployeeModal + ConfirmDialog for deactivation with `ipcClient.employees.setStatus`; uses `useEmployeeList`; shows `ErrorAlert` on IPC error; shows toast on success; (detail slot rendered when id present — wired in T031)
- [X] T020 [US1] Add "الموظفون" nav item to `frontend/components/layout/Sidebar.tsx` — import `Users` icon from lucide-react; insert between الموردون and الإعدادات

**Checkpoint**: Employees list page fully functional — add, edit, deactivate/re-activate, photo upload, empty state, search, toasts all work independently

---

## Phase 4: User Story 2 — Employee Financial Overview (Priority: P2)

**Goal**: Clicking any employee opens a detail view with their profile, financial summary (total earned/paid/balance), per-type operations summary, and full chronological operations history. Manager can manually add operation records directly from the detail view.

**Independent Test**: Add an employee, open their detail view — all totals show 0 with EmptyState. Add operations of two different types; verify groupings, subtotals, and financial summary all calculate correctly — no other module needed (quickstart Steps 9–12)

### Implementation for User Story 2

- [X] T021 [US2] Add `getEmployeeById(id)` and `insertOperation(data)` to `electron/features/employees/employees.queries.ts` — `getEmployeeById` returns employee row + all operation rows (flat, ordered by operation_date DESC) + all payment rows (ordered by payment_date DESC) + aggregates (totalEarned, totalPaid); uses LEFT JOINs with COALESCE for null-safe sums
- [X] T022 [US2] Add `getEmployeeById(id): EmployeeDetail` and `addOperation(payload): EmployeeDetail` to `electron/features/employees/employees.service.ts` — `getEmployeeById` groups flat operation rows by `operation_type`, computes per-group `subtotal` and `count`, builds `OperationGroup[]`, maps full `EmployeeDetail` DTO; `addOperation` inserts row with `total_amount = quantity × pricePerUnit`, then calls `getEmployeeById` to return updated detail
- [X] T023 [US2] Register `employees:getById` and `employees:addOperation` handlers in `electron/ipc/employees.handler.ts`
- [X] T024 [P] [US2] Create `frontend/hooks/useEmployeeDetail.ts` — takes `id: string`; fetches `ipcClient.employees.getById({id})`; exposes `detail: EmployeeDetail | null`, `loading`, `error`, `refetch`; also accepts `onDetailUpdate(detail: EmployeeDetail)` callback pattern for mutation responses
- [X] T025 [P] [US2] Create `frontend/components/employees/FinancialSummaryCard.tsx` — displays total earned, total paid, balance due in a card grid; balance due shown prominently (green if positive, red if negative with negative sign); all values formatted as currency
- [X] T026 [P] [US2] Create `frontend/components/employees/OperationsSummaryCard.tsx` — renders one card per operation type that has records; shows type label, operation count, and subtotal earned; horizontal scrollable row layout
- [X] T027 [P] [US2] Create `frontend/components/employees/AddOperationModal.tsx` — type selector (cutting/distribution/qc/finition/custom with Arabic labels), date picker (defaults to today), quantity input, price per unit input; total = quantity × pricePerUnit auto-displayed (read-only); calls `ipcClient.employees.addOperation`; on success passes returned EmployeeDetail to parent callback
- [X] T028 [US2] Create `frontend/components/employees/OperationsHistory.tsx` — accepts `operationGroups: OperationGroup[]`, `employeeId`, `onOperationAdded(detail: EmployeeDetail)` props; renders one group section per type with header, operation rows (type, date, qty, price/unit, total), subtotal footer; EmptyState when no operations; "إضافة عملية" button opens AddOperationModal
- [X] T029 [US2] Create `frontend/components/employees/EmployeeDetailPanel.tsx` — profile section at top (photo or avatar placeholder, name, role, phone, notes, status badge); two-column summary row (FinancialSummaryCard left, OperationsSummaryCard right); OperationsHistory below; PaymentsHistory placeholder div below that (replaced in T038); back button; back button calls `onBack` prop; ≤ 150 lines
- [X] T030 [US2] Create `frontend/components/employees/EmployeeDetailView.tsx` — loading skeleton → ErrorAlert → "الموظف غير موجود" → `<EmployeeDetailPanel>`; uses `useEmployeeDetail(id)`; passes `onOperationAdded` callback that updates detail state
- [X] T031 [US2] Wire `EmployeeDetailView` into `frontend/app/(dashboard)/employees/page.tsx` — when `?id=` search param is present render `<EmployeeDetailView id={id} onBack={() => router.replace('/employees')} />` instead of the list view

**Checkpoint**: Employee detail view with financial overview and manual operation entry works — navigate to detail, back to list, operations groupings and subtotals calculate correctly

---

## Phase 5: User Story 3 — Payment Logging (Priority: P3)

**Goal**: From the detail view, manager can log payments (add), correct them (edit), and remove mistakes (delete). Balance due updates immediately after each action.

**Independent Test**: Log a payment on an employee with a known balance → balance decreases. Edit the payment → balance recalculates. Delete the payment → balance restores. Overpay → negative balance shown. Confirmation dialog appears on delete (quickstart Steps 13–17)

### Implementation for User Story 3

- [X] T032 [US3] Add `insertPayment(data)`, `updatePaymentById(id, data)`, `deletePaymentById(id)` query functions to `electron/features/employees/employees.queries.ts` — `deletePaymentById` returns the `employee_id` so the service can call `getEmployeeById` after deletion
- [X] T033 [US3] Add `addPayment(payload): EmployeeDetail`, `updatePayment(payload): EmployeeDetail`, `deletePayment(payload): EmployeeDetail` service functions to `electron/features/employees/employees.service.ts` — each mutates the payment record then calls `getEmployeeById` to return the refreshed detail DTO
- [X] T034 [US3] Register `employees:addPayment`, `employees:updatePayment`, `employees:deletePayment` handlers in `electron/ipc/employees.handler.ts`
- [X] T035 [P] [US3] Create `frontend/components/employees/AddPaymentModal.tsx` — react-hook-form + Zod; amount (required, > 0), payment date (required, defaults to today), notes (optional); calls `ipcClient.employees.addPayment`; on success passes returned EmployeeDetail to `onSuccess(detail)` callback
- [X] T036 [P] [US3] Create `frontend/components/employees/EditPaymentModal.tsx` — pre-filled with existing payment values; same fields as AddPaymentModal; calls `ipcClient.employees.updatePayment`; on success passes returned EmployeeDetail to `onSuccess(detail)` callback
- [X] T037 [US3] Create `frontend/components/employees/PaymentsHistory.tsx` — accepts `payments: PaymentRecord[]`, `employeeId`, `onPaymentMutated(detail: EmployeeDetail)` props; renders payment rows (amount, date, notes) each with edit button (opens EditPaymentModal) and delete button (opens ConfirmDialog before `ipcClient.employees.deletePayment`); EmptyState when no payments; "تسجيل دفعة" button opens AddPaymentModal
- [X] T038 [US3] Replace the PaymentsHistory placeholder in `frontend/components/employees/EmployeeDetailPanel.tsx` with the actual `<PaymentsHistory>` component; wire `onPaymentMutated` to update local `detail` state so totals refresh immediately

**Checkpoint**: Full feature complete — all 3 user stories functional end-to-end

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate full integration and confirm quickstart walkthrough passes

- [X] T039 [P] Run TypeScript compiler check (`tsc --noEmit`) across all modified/new files and fix any type errors
- [X] T040 Validate `dir="rtl"` present on all new employee UI components and pages
- [X] T041 Walk through `specs/004-employee-management/quickstart.md` Steps 1–19 end-to-end and verify all assertions pass
- [X] T042 [P] Review all new components for 150-line limit; split any that exceed it

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2; no dependency on US2/US3
- **US2 (Phase 4)**: Depends on Phase 2; T021–T023 modify files created in US1 (T010–T012) — sequence after US1 backend tasks; T031 modifies `employees/page.tsx` created in T019 — must run after T019
- **US3 (Phase 5)**: Depends on Phase 2; T032–T034 modify files from US1/US2 — sequence after US2 backend tasks; T038 modifies `EmployeeDetailPanel.tsx` from T029 — must run after T029
- **Polish (Phase 6)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2
- **US2 (P2)**: Independent after Phase 2; backend tasks T021–T023 extend US1 files — run after T010–T013; frontend tasks T024–T030 are fully independent; T031 extends T019
- **US3 (P3)**: Independent after Phase 2; T032–T034 extend US1/US2 files — run after T021–T023; T037–T038 extend US2 components — run after T029

### Parallel Opportunities

- T003, T004, T005 in Phase 2 can run in parallel (different schema files)
- T007, T008 in Phase 2 can run in parallel with each other (different files)
- T014, T015 in Phase 3 can run in parallel (different files)
- T024, T025, T026, T027 in Phase 4 can run in parallel (different files)
- T035, T036 in Phase 5 can run in parallel (different files)
- T039, T042 in Phase 6 can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# These can run simultaneously (different files):
Task T003: "Create electron/db/schema/employee.ts"
Task T004: "Create electron/db/schema/employee_operation.ts"
Task T005: "Create electron/db/schema/employee_payment.ts"
Task T007: "Add employees namespace to electron/preload/index.ts"
Task T008: "Create frontend/features/employees/employees.types.ts"
# T006 must run after T003, T004, T005 (same file: electron/db/index.ts)
# T009 must run after T007 and T008 (depends on preload types + TS types)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 — Manage Employee Directory
4. **STOP and VALIDATE**: Can add/edit/deactivate/re-activate employees; sidebar link works; balance column shows 0; empty state and toasts work
5. Proceed to Phase 4 (US2) once US1 validated

### Incremental Delivery

1. Setup + Foundational → schemas, IPC bridge, types ready
2. US1 → Employee CRUD with sidebar nav (MVP — standalone value)
3. US2 → Operations history + financial overview (adds core value)
4. US3 → Payment logging with edit/delete (completes the financial loop)

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- T003–T005 can run in parallel; T006 must run after all three (same file: `electron/db/index.ts`)
- T009 modifies `frontend/lib/ipc-client.ts` — run after T008
- T021–T023 extend files created in T010–T012 — run after US1 backend is complete
- T031 modifies `employees/page.tsx` from T019 — run after T019
- T032–T034 extend files from T010–T023 — run after US2 backend is complete
- T038 modifies `EmployeeDetailPanel.tsx` from T029 — run after T029
- Photo helpers pattern: identical to stock.service.ts image helpers — use `userData/employee-photos/` dir
- Balance due: computed with SQL subqueries (COALESCE to handle null when no records), never stored — always fresh
- `addOperation` / `addPayment` / `updatePayment` / `deletePayment` all return fresh `EmployeeDetail` — no second IPC call needed after mutations
- Status toggle: deactivation requires ConfirmDialog (constitution); re-activation does not (FR-004)
- Negative balance (advance payment) shows in red — no blocking required (FR-017, spec edge case)
