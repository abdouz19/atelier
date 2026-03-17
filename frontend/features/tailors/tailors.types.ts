export type TailorStatus = 'active' | 'inactive';

export interface TailorSummary {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  status: TailorStatus;
  totalEarned: number;
  totalPaid: number;
  balanceDue: number;
}

export interface TailorSewingTransaction {
  batchId: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  quantity: number;
  sewingPricePerPiece: number;
  totalCost: number;
  distributionDate: number;
}

export interface TailorPaymentRecord {
  id: string;
  amount: number;
  paymentDate: number;
  notes: string | null;
}

export interface TailorDetail {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  status: TailorStatus;
  totalEarned: number;
  totalPaid: number;
  balanceDue: number;
  sewingTransactions: TailorSewingTransaction[];
  payments: TailorPaymentRecord[];
}

export interface CreateTailorPayload {
  name: string;
  phone?: string;
  notes?: string;
}

export interface UpdateTailorPayload {
  id: string;
  name?: string;
  phone?: string | null;
  notes?: string | null;
}

export interface AddTailorPaymentPayload {
  tailorId: string;
  amount: number;
  paymentDate: number;
  notes?: string;
}

export interface UpdateTailorPaymentPayload {
  id: string;
  amount?: number;
  paymentDate?: number;
  notes?: string | null;
}
