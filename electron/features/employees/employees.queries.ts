import { eq, sql, asc, desc } from 'drizzle-orm';
import { db } from '../../db/index';
import { employees, type Employee, type NewEmployee } from '../../db/schema/employee';
import { employeeOperations, type NewEmployeeOperation } from '../../db/schema/employee_operation';
import { employeePayments, type NewEmployeePayment } from '../../db/schema/employee_payment';

// ── Summary row (with computed balance_due) ───────────────────────────────────

export interface EmployeeSummaryRow {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  notes: string | null;
  photo_path: string | null;
  status: string;
  created_at: Date | null;
  updated_at: Date | null;
  balance_due: number;
}

export function getAllEmployees(): EmployeeSummaryRow[] {
  return db
    .select({
      id: employees.id,
      name: employees.name,
      phone: employees.phone,
      role: employees.role,
      notes: employees.notes,
      photo_path: employees.photo_path,
      status: employees.status,
      created_at: employees.created_at,
      updated_at: employees.updated_at,
      balance_due: sql<number>`
        COALESCE((SELECT SUM(total_amount) FROM employee_operations WHERE employee_id = ${employees.id}), 0)
        - COALESCE((SELECT SUM(amount) FROM employee_payments WHERE employee_id = ${employees.id}), 0)
      `,
    })
    .from(employees)
    .orderBy(asc(employees.name))
    .all();
}

export function getEmployeeById(id: string): Employee | undefined {
  return db.select().from(employees).where(eq(employees.id, id)).get();
}

export function insertEmployee(data: NewEmployee): Employee {
  const now = new Date();
  db.insert(employees).values({ ...data, created_at: now, updated_at: now }).run();
  return db.select().from(employees).where(eq(employees.id, data.id!)).get()!;
}

export function updateEmployeeById(
  id: string,
  data: Partial<Omit<Employee, 'id' | 'created_at'>>,
): void {
  db.update(employees)
    .set({ ...data, updated_at: new Date() })
    .where(eq(employees.id, id))
    .run();
}

export function setEmployeeStatus(id: string, status: 'active' | 'inactive'): void {
  db.update(employees)
    .set({ status, updated_at: new Date() })
    .where(eq(employees.id, id))
    .run();
}

// ── Operations ────────────────────────────────────────────────────────────────

export interface OperationRow {
  id: string;
  employee_id: string;
  operation_type: string;
  source_module: string | null;
  source_reference_id: string | null;
  operation_date: Date | null;
  quantity: number;
  price_per_unit: number;
  total_amount: number;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export function getOperationsForEmployee(employeeId: string): OperationRow[] {
  return db
    .select()
    .from(employeeOperations)
    .where(eq(employeeOperations.employee_id, employeeId))
    .orderBy(desc(employeeOperations.operation_date))
    .all();
}

export function insertOperation(data: NewEmployeeOperation): void {
  const now = new Date();
  db.insert(employeeOperations).values({ ...data, created_at: now, updated_at: now }).run();
}

// ── Payments ──────────────────────────────────────────────────────────────────

export interface PaymentRow {
  id: string;
  employee_id: string;
  amount: number;
  payment_date: Date | null;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export function getPaymentsForEmployee(employeeId: string): PaymentRow[] {
  return db
    .select()
    .from(employeePayments)
    .where(eq(employeePayments.employee_id, employeeId))
    .orderBy(desc(employeePayments.payment_date))
    .all();
}

export function insertPayment(data: NewEmployeePayment): void {
  const now = new Date();
  db.insert(employeePayments).values({ ...data, created_at: now, updated_at: now }).run();
}

export function updatePaymentById(
  id: string,
  data: Partial<Pick<typeof employeePayments.$inferSelect, 'amount' | 'payment_date' | 'notes'>>,
): string | undefined {
  const existing = db
    .select({ employee_id: employeePayments.employee_id })
    .from(employeePayments)
    .where(eq(employeePayments.id, id))
    .get();
  if (!existing) return undefined;
  db.update(employeePayments)
    .set({ ...data, updated_at: new Date() })
    .where(eq(employeePayments.id, id))
    .run();
  return existing.employee_id;
}

export function deletePaymentById(id: string): string | undefined {
  const existing = db
    .select({ employee_id: employeePayments.employee_id })
    .from(employeePayments)
    .where(eq(employeePayments.id, id))
    .get();
  if (!existing) return undefined;
  db.delete(employeePayments).where(eq(employeePayments.id, id)).run();
  return existing.employee_id;
}

// ── Aggregates (for detail view) ──────────────────────────────────────────────

export interface EmployeeAggregates {
  totalEarned: number;
  totalPaid: number;
}

export function getEmployeeAggregates(employeeId: string): EmployeeAggregates {
  const earned = db
    .select({ total: sql<number>`COALESCE(SUM(total_amount), 0)` })
    .from(employeeOperations)
    .where(eq(employeeOperations.employee_id, employeeId))
    .get();
  const paid = db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(employeePayments)
    .where(eq(employeePayments.employee_id, employeeId))
    .get();
  return {
    totalEarned: earned?.total ?? 0,
    totalPaid: paid?.total ?? 0,
  };
}
