# Data Model: Employee Management

**Branch**: `004-employee-management` | **Date**: 2026-03-14

---

## Entities

### employees

Stores the employee directory. Status drives visibility in selectors across the app.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PK | UUID, generated at write time |
| `name` | TEXT | NOT NULL | Required; non-empty |
| `phone` | TEXT | nullable | |
| `role` | TEXT | nullable | Free text (e.g., فصال، خياط) |
| `notes` | TEXT | nullable | |
| `photo_path` | TEXT | nullable | Filename only; resolved to absolute path in service |
| `status` | TEXT | NOT NULL, DEFAULT 'active' | `'active'` \| `'inactive'` |
| `created_at` | INTEGER | NOT NULL | Timestamp (ms) |
| `updated_at` | INTEGER | NOT NULL | Timestamp (ms) |

**Indexes**:
- `idx_employees_status ON employees(status)` — filter active employees for selectors

**Validation rules**:
- `name` must be non-empty after trimming
- `status` must be one of `'active'`, `'inactive'`
- `photo_path` stores a filename only (e.g., `uuid.jpg`); the service resolves it to `file:///userData/employee-photos/uuid.jpg`

**State transitions**:
```
active ⟷ inactive   (bidirectional, requires ConfirmDialog on deactivation)
```

---

### employee_operations

Records a unit of work performed by an employee. Created manually from the employee detail view or auto-linked by a production module (cutting, distribution, QC, finition). Identified by `source_module = null` for manual records.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PK | UUID |
| `employee_id` | TEXT | NOT NULL, FK → employees.id | |
| `operation_type` | TEXT | NOT NULL | `'cutting'` \| `'distribution'` \| `'qc'` \| `'finition'` \| `'custom'` |
| `source_module` | TEXT | nullable | `null` for manual; module name for auto-linked |
| `source_reference_id` | TEXT | nullable | `null` for manual; source record ID for auto-linked |
| `operation_date` | INTEGER | NOT NULL | Timestamp (ms) |
| `quantity` | REAL | NOT NULL, CHECK > 0 | |
| `price_per_unit` | REAL | NOT NULL, CHECK >= 0 | |
| `total_amount` | REAL | NOT NULL | Stored as `quantity × price_per_unit`; computed at write, not recalculated |
| `notes` | TEXT | nullable | |
| `created_at` | INTEGER | NOT NULL | Timestamp (ms) |
| `updated_at` | INTEGER | NOT NULL | Timestamp (ms) |

**Indexes**:
- `idx_employee_ops_employee_date ON employee_operations(employee_id, operation_date DESC)` — primary access pattern for detail view

**Validation rules**:
- `quantity` > 0
- `price_per_unit` >= 0
- `total_amount` = `quantity × price_per_unit` (enforced in service, not DB constraint)
- `operation_type` must be one of the five allowed values

---

### employee_payments

Records a payment made to an employee. Fully mutable (edit and delete supported).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PK | UUID |
| `employee_id` | TEXT | NOT NULL, FK → employees.id | |
| `amount` | REAL | NOT NULL, CHECK > 0 | |
| `payment_date` | INTEGER | NOT NULL | Timestamp (ms) |
| `notes` | TEXT | nullable | |
| `created_at` | INTEGER | NOT NULL | Timestamp (ms) |
| `updated_at` | INTEGER | NOT NULL | Timestamp (ms) |

**Indexes**:
- `idx_employee_payments_employee_date ON employee_payments(employee_id, payment_date DESC)` — primary access pattern for detail view

**Validation rules**:
- `amount` > 0 (validated with Zod before IPC call)

---

## Relationships

```
employees (1) ─────< employee_operations (N)
employees (1) ─────< employee_payments (N)
```

No cascade deletes — employees are never hard-deleted (FR-006). Operations and payments persist even if the employee is deactivated.

---

## Computed Values (not stored)

| Value | Formula | Where computed |
|---|---|---|
| `balance_due` | `SUM(operations.total_amount) - SUM(payments.amount)` | SQL subquery in `getAll` and `getById` |
| `total_earned` | `SUM(operations.total_amount)` | SQL subquery in `getById` |
| `total_paid` | `SUM(payments.amount)` | SQL subquery in `getById` |
| per-type `subtotal` | `SUM(total_amount) WHERE operation_type = ?` | Service layer grouping |
| per-type `count` | `COUNT(*) WHERE operation_type = ?` | Service layer grouping |

---

## Drizzle Schema Files

| File | Tables defined |
|---|---|
| `electron/db/schema/employee.ts` | `employees` |
| `electron/db/schema/employee_operation.ts` | `employee_operations` |
| `electron/db/schema/employee_payment.ts` | `employee_payments` |

All three schemas must be imported and spread into the `schema` object in `electron/db/index.ts`.

---

## Migration SQL (added to `runMigrations()` in `electron/db/index.ts`)

```sql
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  notes TEXT,
  photo_path TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_operations (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  operation_type TEXT NOT NULL,
  source_module TEXT,
  source_reference_id TEXT,
  operation_date INTEGER NOT NULL,
  quantity REAL NOT NULL CHECK(quantity > 0),
  price_per_unit REAL NOT NULL CHECK(price_per_unit >= 0),
  total_amount REAL NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_payments (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  amount REAL NOT NULL CHECK(amount > 0),
  payment_date INTEGER NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employee_ops_employee_date ON employee_operations(employee_id, operation_date DESC);
CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_date ON employee_payments(employee_id, payment_date DESC);
```
