export interface StockItemSummary {
  id: string;
  name: string;
  type: string;
  unit: string;
  color: string | null;
  imagePath: string | null;
  description: string | null;
  totalQuantity: number;
  variantCount: number;
  isLow: boolean;
}

export interface ColorVariant {
  color: string | null;
  quantity: number;
  isLow: boolean;
}

export interface StockTransaction {
  id: string;
  type: 'inbound' | 'consumed';
  quantity: number;
  color: string | null;
  transactionDate: number;
  notes: string | null;
  sourceModule: string | null;
  sourceReferenceId: string | null;
  modelName: string | null;
  createdAt: number;
  supplierName: string | null;
  pricePerUnit: number | null;
  totalPricePaid: number | null;
}

export interface StockItemDetail {
  id: string;
  name: string;
  type: string;
  unit: string;
  color: string | null;
  imagePath: string | null;
  description: string | null;
  notes: string | null;
  isArchived: boolean;
  totalQuantity: number;
  variants: ColorVariant[];
  transactions: StockTransaction[];
}

export interface CreateStockItemPayload {
  name: string;
  type: string;
  unit: string;
  initialQuantity: number;
  color?: string;
  imageData?: string;
  imageMimeType?: string;
  description?: string;
  notes?: string;
  supplierId?: string;
  pricePerUnit?: number;
  totalPricePaid?: number;
}

export interface UpdateStockItemPayload {
  id: string;
  name?: string;
  type?: string;
  unit?: string;
  color?: string | null;
  imageData?: string | null;
  imageMimeType?: string;
  description?: string | null;
  notes?: string | null;
}

export interface AddInboundPayload {
  stockItemId: string;
  quantity: number;
  color?: string;
  transactionDate: number;
  notes?: string;
  supplierId: string;
  pricePerUnit: number;
  totalPricePaid: number;
}

export interface UpdateTransactionPayload {
  id: string;
  quantity?: number;
  transactionDate?: number;
  supplierId?: string | null;
  pricePerUnit?: number | null;
  totalPricePaid?: number | null;
}

