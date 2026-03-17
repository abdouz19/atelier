import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import * as queries from './employees.queries';

// ── DTOs (mirror frontend employees.types.ts) ─────────────────────────────────

export type EmployeeStatus = 'active' | 'inactive';
export type OperationType = 'cutting' | 'distribution' | 'qc' | 'finition' | 'custom';

export interface EmployeeSummary {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  photoPath: string | null;
  status: EmployeeStatus;
  balanceDue: number;
}

export interface OperationRecord {
  id: string;
  operationType: OperationType;
  sourceModule: string | null;
  operationDate: number;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  notes: string | null;
}

export interface OperationGroup {
  type: OperationType;
  count: number;
  subtotal: number;
  operations: OperationRecord[];
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: number;
  notes: string | null;
}

export interface EmployeeDetail {
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

// ── Payload types ─────────────────────────────────────────────────────────────

export interface CreateEmployeePayload {
  name: string;
  phone?: string;
  role?: string;
  notes?: string;
  photoData?: string;
  photoMimeType?: string;
}

export interface UpdateEmployeePayload {
  id: string;
  name?: string;
  phone?: string | null;
  role?: string | null;
  notes?: string | null;
  photoData?: string | null;
  photoMimeType?: string;
}

export interface SetStatusPayload {
  id: string;
  status: EmployeeStatus;
}

export interface AddOperationPayload {
  employeeId: string;
  operationType: OperationType;
  operationDate: number;
  quantity: number;
  pricePerUnit: number;
  notes?: string;
}

export interface AddPaymentPayload {
  employeeId: string;
  amount: number;
  paymentDate: number;
  notes?: string;
}

export interface UpdatePaymentPayload {
  id: string;
  amount?: number;
  paymentDate?: number;
  notes?: string | null;
}

// ── Photo helpers ─────────────────────────────────────────────────────────────

function getPhotosDir(): string {
  const dir = path.join(app.getPath('userData'), 'employee-photos');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function savePhoto(base64Data: string, mimeType: string): string {
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.byteLength > 5 * 1024 * 1024) throw new Error('حجم الصورة يتجاوز 5 ميغابايت');
  fs.writeFileSync(path.join(getPhotosDir(), filename), buffer);
  return filename;
}

function deletePhoto(filename: string): void {
  try { fs.unlinkSync(path.join(getPhotosDir(), filename)); } catch { /* ignore */ }
}

function resolvePhotoPath(filename: string | null): string | null {
  if (!filename) return null;
  const full = path.join(getPhotosDir(), filename);
  return fs.existsSync(full) ? `file://${full}` : null;
}

function validatePhotoMimeType(mimeType: string): void {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new Error('نوع الصورة غير مدعوم. يُسمح فقط بـ JPG أو PNG أو WEBP');
  }
}

// ── DTO mappers ───────────────────────────────────────────────────────────────

function toSummary(row: queries.EmployeeSummaryRow): EmployeeSummary {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? null,
    role: row.role ?? null,
    photoPath: resolvePhotoPath(row.photo_path ?? null),
    status: row.status as EmployeeStatus,
    balanceDue: row.balance_due,
  };
}

const TYPE_ORDER: OperationType[] = ['cutting', 'distribution', 'qc', 'finition', 'custom'];

function buildDetail(
  employee: { id: string; name: string; phone: string | null; role: string | null; notes: string | null; photo_path: string | null; status: string },
  operations: queries.OperationRow[],
  payments: queries.PaymentRow[],
  aggregates: queries.EmployeeAggregates,
): EmployeeDetail {
  const groupMap = new Map<string, OperationRecord[]>();
  for (const op of operations) {
    const list = groupMap.get(op.operation_type) ?? [];
    list.push({
      id: op.id,
      operationType: op.operation_type as OperationType,
      sourceModule: op.source_module,
      operationDate: op.operation_date instanceof Date ? op.operation_date.getTime() : Number(op.operation_date ?? 0),
      quantity: op.quantity,
      pricePerUnit: op.price_per_unit,
      totalAmount: op.total_amount,
      notes: op.notes,
    });
    groupMap.set(op.operation_type, list);
  }

  const operationGroups: OperationGroup[] = TYPE_ORDER.filter((t) => groupMap.has(t)).map((t) => {
    const ops = groupMap.get(t)!;
    return { type: t, count: ops.length, subtotal: ops.reduce((s, o) => s + o.totalAmount, 0), operations: ops };
  });

  return {
    id: employee.id,
    name: employee.name,
    phone: employee.phone,
    role: employee.role,
    notes: employee.notes,
    photoPath: resolvePhotoPath(employee.photo_path),
    status: employee.status as EmployeeStatus,
    totalEarned: aggregates.totalEarned,
    totalPaid: aggregates.totalPaid,
    balanceDue: aggregates.totalEarned - aggregates.totalPaid,
    operationGroups,
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      paymentDate: p.payment_date instanceof Date ? p.payment_date.getTime() : Number(p.payment_date ?? 0),
      notes: p.notes,
    })),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getAll(): EmployeeSummary[] {
  return queries.getAllEmployees().map(toSummary);
}

export function createEmployee(payload: CreateEmployeePayload): EmployeeSummary {
  const name = payload.name?.trim();
  if (!name) throw new Error('اسم الموظف مطلوب');

  let photoPath: string | undefined;
  if (payload.photoData && payload.photoMimeType) {
    validatePhotoMimeType(payload.photoMimeType);
    photoPath = savePhoto(payload.photoData, payload.photoMimeType);
  }

  const id = crypto.randomUUID();
  queries.insertEmployee({
    id,
    name,
    phone: payload.phone ?? null,
    role: payload.role ?? null,
    notes: payload.notes ?? null,
    photo_path: photoPath ?? null,
    status: 'active',
  });

  const found = queries.getAllEmployees().find((r) => r.id === id);
  if (!found) throw new Error('حدث خطأ أثناء إنشاء الموظف');
  return toSummary(found);
}

export function updateEmployee(payload: UpdateEmployeePayload): EmployeeSummary {
  const employee = queries.getEmployeeById(payload.id);
  if (!employee) throw new Error('الموظف غير موجود');

  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    const n = payload.name.trim();
    if (!n) throw new Error('اسم الموظف مطلوب');
    updates.name = n;
  }
  if ('phone' in payload) updates.phone = payload.phone;
  if ('role' in payload) updates.role = payload.role;
  if ('notes' in payload) updates.notes = payload.notes;

  if ('photoData' in payload) {
    if (payload.photoData === null) {
      if (employee.photo_path) deletePhoto(employee.photo_path);
      updates.photo_path = null;
    } else if (payload.photoData && payload.photoMimeType) {
      validatePhotoMimeType(payload.photoMimeType);
      if (employee.photo_path) deletePhoto(employee.photo_path);
      updates.photo_path = savePhoto(payload.photoData, payload.photoMimeType);
    }
  }

  queries.updateEmployeeById(payload.id, updates as Parameters<typeof queries.updateEmployeeById>[1]);
  const found = queries.getAllEmployees().find((r) => r.id === payload.id);
  if (!found) throw new Error('حدث خطأ أثناء تحديث الموظف');
  return toSummary(found);
}

export function setStatus(payload: SetStatusPayload): void {
  if (!queries.getEmployeeById(payload.id)) throw new Error('الموظف غير موجود');
  queries.setEmployeeStatus(payload.id, payload.status);
}

export function getEmployeeById(id: string): EmployeeDetail {
  const employee = queries.getEmployeeById(id);
  if (!employee) throw new Error('الموظف غير موجود');
  return buildDetail(
    employee,
    queries.getOperationsForEmployee(id),
    queries.getPaymentsForEmployee(id),
    queries.getEmployeeAggregates(id),
  );
}

export function addOperation(payload: AddOperationPayload): EmployeeDetail {
  if (!queries.getEmployeeById(payload.employeeId)) throw new Error('الموظف غير موجود');
  if (payload.quantity <= 0) throw new Error('الكمية يجب أن تكون أكبر من صفر');
  if (payload.pricePerUnit < 0) throw new Error('سعر الوحدة لا يمكن أن يكون سالباً');
  const allowed: OperationType[] = ['cutting', 'distribution', 'qc', 'finition', 'custom'];
  if (!allowed.includes(payload.operationType)) throw new Error('نوع العملية غير صحيح');

  queries.insertOperation({
    id: crypto.randomUUID(),
    employee_id: payload.employeeId,
    operation_type: payload.operationType,
    source_module: null,
    source_reference_id: null,
    operation_date: new Date(payload.operationDate),
    quantity: payload.quantity,
    price_per_unit: payload.pricePerUnit,
    total_amount: payload.quantity * payload.pricePerUnit,
    notes: payload.notes ?? null,
  });

  return getEmployeeById(payload.employeeId);
}

export function addPayment(payload: AddPaymentPayload): EmployeeDetail {
  if (!queries.getEmployeeById(payload.employeeId)) throw new Error('الموظف غير موجود');
  if (payload.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر');

  queries.insertPayment({
    id: crypto.randomUUID(),
    employee_id: payload.employeeId,
    amount: payload.amount,
    payment_date: new Date(payload.paymentDate),
    notes: payload.notes ?? null,
  });

  return getEmployeeById(payload.employeeId);
}

export function updatePayment(payload: UpdatePaymentPayload): EmployeeDetail {
  if (payload.amount !== undefined && payload.amount <= 0) {
    throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر');
  }

  const updates: Parameters<typeof queries.updatePaymentById>[1] = {};
  if (payload.amount !== undefined) updates.amount = payload.amount;
  if (payload.paymentDate !== undefined) updates.payment_date = new Date(payload.paymentDate);
  if ('notes' in payload) updates.notes = payload.notes ?? null;

  const employeeId = queries.updatePaymentById(payload.id, updates);
  if (!employeeId) throw new Error('الدفعة غير موجودة');
  return getEmployeeById(employeeId);
}

export function deletePayment(payload: { id: string }): EmployeeDetail {
  const employeeId = queries.deletePaymentById(payload.id);
  if (!employeeId) throw new Error('الدفعة غير موجودة');
  return getEmployeeById(employeeId);
}
