export interface SupplierSummary {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  productsSold: string | null;
  notes: string | null;
  isDeleted: boolean;
}

export interface PurchaseRecord {
  transactionId: string;
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  unit: string;
  color: string | null;
  pricePerUnit: number;
  totalPricePaid: number;
  transactionDate: number;
}

export interface SupplierDetail extends SupplierSummary {
  totalSpent: number;
  purchases: PurchaseRecord[];
}

export interface CreateSupplierPayload {
  name: string;
  phone?: string;
  address?: string;
  productsSold?: string;
  notes?: string;
}

export interface UpdateSupplierPayload {
  id: string;
  name?: string;
  phone?: string | null;
  address?: string | null;
  productsSold?: string | null;
  notes?: string | null;
}
