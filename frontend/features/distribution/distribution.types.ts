export interface DistributionKpis {
  piecesInDistribution: number;
  piecesReturned: number;
  piecesNotYetReturned: number;
  tailorsWithActiveDist: number;
  totalSewingCost: number;
  totalUnsettledCost: number;
}

export interface DistributionTailorSummary {
  tailorId: string;
  tailorName: string;
  piecesInDistribution: number;
  piecesReturned: number;
  piecesNotYetReturned: number;
  totalEarned: number;
  settledAmount: number;
  remainingBalance: number;
}

export interface ReturnConsumptionEntry {
  stockItemName: string;
  color: string | null;
  quantity: number;
}

export interface DistributionReturnRow {
  id: string;
  quantityReturned: number;
  returnDate: number;
  consumptionEntries: ReturnConsumptionEntry[];
}

export interface DistributionBatchRow {
  id: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  quantity: number;
  remainingQuantity: number;
  sewingPricePerPiece: number;
  totalCost: number;
  distributionDate: number;
  returns: DistributionReturnRow[];
}

export interface DistributionTailorDetail {
  tailorId: string;
  tailorName: string;
  batches: DistributionBatchRow[];
}

export interface DistributionBatchOption {
  id: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  quantityDistributed: number;
  remainingQuantity: number;
  distributionDate: number;
}

export interface AvailabilityCombination {
  partName: string | null;
  sizeLabel: string;
  color: string;
  notDistributedCount: number;
}

export interface DistributePayload {
  tailorId: string;
  modelName: string;
  partName?: string | null;
  sizeLabel: string;
  color: string;
  quantity: number;
  sewingPricePerPiece: number;
  distributionDate: number;
}

export interface ReturnConsumptionRowPayload {
  stockItemId: string;
  color: string | null;
  quantity: number;
}

export interface ReturnPayload {
  batchId: string;
  quantityReturned: number;
  returnDate: number;
  consumptionRows: ReturnConsumptionRowPayload[];
}

export interface DistributionNonFabricItem {
  id: string;
  name: string;
  unit: string;
  colors: Array<{ color: string; available: number }>;
  totalAvailable: number;
}
