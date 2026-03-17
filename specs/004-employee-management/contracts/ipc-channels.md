# IPC Channel Contracts: Employee Management

**Branch**: `004-employee-management` | **Date**: 2026-03-14

All channels follow the project-standard response envelope:
- Success: `{ success: true, data: T }`
- Failure: `{ success: false, error: string }`

---

## TypeScript Types

```typescript
// ── Shared ────────────────────────────────────────────────────────────────────

type EmployeeStatus = 'active' | 'inactive';
type OperationType = 'cutting' | 'distribution' | 'qc' | 'finition' | 'custom';

// ── DTOs ──────────────────────────────────────────────────────────────────────

interface EmployeeSummary {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  photoPath: string | null;       // absolute file:// path or null
  status: EmployeeStatus;
  balanceDue: number;             // total earned − total paid (can be negative)
}

interface OperationRecord {
  id: string;
  operationType: OperationType;
  sourceModule: string | null;    // null = manually entered
  operationDate: number;          // ms timestamp
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  notes: string | null;
}

interface OperationGroup {
  type: OperationType;
  count: number;
  subtotal: number;               // sum of totalAmount for this type
  operations: OperationRecord[];
}

interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: number;            // ms timestamp
  notes: string | null;
}

interface EmployeeDetail {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  notes: string | null;
  photoPath: string | null;
  status: EmployeeStatus;
  totalEarned: number;
  totalPaid: number;
  balanceDue: number;
  operationGroups: OperationGroup[];
  payments: PaymentRecord[];
}

// ── Payloads ──────────────────────────────────────────────────────────────────

interface CreateEmployeePayload {
  name: string;                   // required, non-empty
  phone?: string;
  role?: string;
  notes?: string;
  photoData?: string;             // base64 encoded
  photoMimeType?: string;         // 'image/jpeg' | 'image/png' | 'image/webp'
}

interface UpdateEmployeePayload {
  id: string;
  name?: string;
  phone?: string | null;
  role?: string | null;
  notes?: string | null;
  photoData?: string | null;      // null = remove photo; string = replace photo; undefined = no change
  photoMimeType?: string;
}

interface SetStatusPayload {
  id: string;
  status: EmployeeStatus;
}

interface AddOperationPayload {
  employeeId: string;
  operationType: OperationType;
  operationDate: number;          // ms timestamp
  quantity: number;               // > 0
  pricePerUnit: number;           // >= 0
  notes?: string;
}

interface AddPaymentPayload {
  employeeId: string;
  amount: number;                 // > 0
  paymentDate: number;            // ms timestamp
  notes?: string;
}

interface UpdatePaymentPayload {
  id: string;
  amount?: number;                // > 0 if provided
  paymentDate?: number;
  notes?: string | null;
}
```

---

## Channels

### `employees:getAll`

Returns all employees (active and inactive) with computed balance.

**Input**: none

**Output**: `{ success: true; data: EmployeeSummary[] }`

**Notes**: Ordered by name ascending. `balanceDue` computed via SQL subqueries — no second fetch needed.

---

### `employees:getById`

Returns full employee detail including grouped operations and payment history.

**Input**: `{ id: string }`

**Output**: `{ success: true; data: EmployeeDetail }`

**Error cases**:
- `"الموظف غير موجود"` — no employee with that ID

**Notes**: `operationGroups` ordered by type label. Within each group, `operations` ordered by `operationDate DESC`. `payments` ordered by `paymentDate DESC`.

---

### `employees:create`

Creates a new employee.

**Input**: `CreateEmployeePayload`

**Output**: `{ success: true; data: EmployeeSummary }`

**Validation** (enforced in service before write):
- `name` non-empty after trim
- If `photoData` provided, `photoMimeType` must be `image/jpeg`, `image/png`, or `image/webp`; decoded size ≤ 5 MB

---

### `employees:update`

Updates profile fields of an existing employee.

**Input**: `UpdateEmployeePayload`

**Output**: `{ success: true; data: EmployeeSummary }`

**Notes**: Only fields present in payload are updated. `photoData: null` removes the existing photo and deletes the file. `photoData: undefined` (field absent) leaves photo unchanged.

---

### `employees:setStatus`

Toggles employee status between active and inactive.

**Input**: `SetStatusPayload`

**Output**: `{ success: true; data: null }`

**Error cases**:
- `"الموظف غير موجود"` — no employee with that ID

---

### `employees:addOperation`

Manually adds an operation record linked to an employee.

**Input**: `AddOperationPayload`

**Output**: `{ success: true; data: EmployeeDetail }` — returns updated detail so UI can refresh in one step

**Validation**:
- `employeeId` must reference an existing employee
- `quantity` > 0
- `pricePerUnit` >= 0
- `operationType` must be one of the five allowed values
- `total_amount` stored as `quantity × pricePerUnit`

---

### `employees:addPayment`

Logs a payment to an employee.

**Input**: `AddPaymentPayload`

**Output**: `{ success: true; data: EmployeeDetail }` — returns updated detail (balance recalculates immediately)

**Validation**:
- `employeeId` must reference an existing employee
- `amount` > 0

---

### `employees:updatePayment`

Edits an existing payment's amount, date, or notes.

**Input**: `UpdatePaymentPayload`

**Output**: `{ success: true; data: EmployeeDetail }` — returns updated detail for parent employee

**Validation**:
- `id` must reference an existing payment
- If `amount` provided, must be > 0

---

### `employees:deletePayment`

Deletes a payment record permanently.

**Input**: `{ id: string }`

**Output**: `{ success: true; data: EmployeeDetail }` — returns updated detail for parent employee

**Error cases**:
- `"الدفعة غير موجودة"` — no payment with that ID

---

## Frontend Types File

`frontend/features/employees/employees.types.ts` exports all interfaces listed above for use in hooks, components, and `ipc-client.ts`.
