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
  sourceReferenceId: string | null;
  operationDate: number;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  modelName: string | null;
  color: string | null;
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
