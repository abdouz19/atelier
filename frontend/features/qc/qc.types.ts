export interface QcKpis {
  pendingQc: number;
  totalReviewed: number;
  totalDamaged: number;
  totalAcceptable: number;
  totalGood: number;
  totalVeryGood: number;
  finitionPending: number;
  readyForStock: number;
}

export interface ReturnBatchForQc {
  returnId: string;
  batchId: string;
  tailorName: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  quantityReturned: number;
  quantityReviewed: number;
  quantityAvailable: number;
  returnDate: number;
  costPerFinalItem: number | null;
}

export interface QcRecordSummary {
  id: string;
  returnId: string;
  tailorName: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  employeeName: string;
  reviewDate: number;
  quantityReviewed: number;
  qtyDamaged: number;
  qtyAcceptable: number;
  qtyGood: number;
  qtyVeryGood: number;
  pricePerPiece: number;
  totalCost: number;
  batchStatus: 'جزئي' | 'مكتمل';
}

export interface ConsumptionEntryInput {
  stockItemId: string;
  color?: string;
  quantity: number;
}

export interface CreateQcPayload {
  returnId: string;
  employeeId: string;
  quantityReviewed: number;
  qtyDamaged: number;
  qtyAcceptable: number;
  qtyGood: number;
  qtyVeryGood: number;
  pricePerPiece: number;
  reviewDate: number;
  consumptionEntries?: ConsumptionEntryInput[];
  materialBatchConsumptions?: import('@/features/cutting/cutting.types').MaterialBatchConsumption[];
  transportationCost?: number;
}
