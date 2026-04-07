export interface DistributionKpis {
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

export interface DistributionBatchPart {
  partName: string;
  quantity: number;
  avgUnitCost?: number | null;
}

export interface BatchConsumedMaterial {
  itemName: string;
  color: string | null;
  quantity: number;
}

export interface DistributionBatchRow {
  id: string;
  modelName: string;
  sizeLabel: string | null;
  color: string | null;
  quantity: number;
  expectedPiecesCount: number;
  remainingQuantity: number;
  sewingPricePerPiece: number;
  piecesCost: number | null;
  sewingCost: number | null;
  materialsCost: number | null;
  totalCost: number;
  costPerFinalItem: number | null;
  distributionDate: number;
  parts: DistributionBatchPart[];
  consumedMaterials: BatchConsumedMaterial[];
  returns: DistributionReturnRow[];
}

export interface DistributionTailorDetail {
  tailorId: string;
  tailorName: string;
  batches: DistributionBatchRow[];
  totalEarned: number;
  settledAmount: number;
  remainingBalance: number;
}

export interface DistributionBatchLogRow {
  id: string;
  tailorId: string;
  tailorName: string;
  modelName: string;
  sizeLabel: string | null;
  color: string | null;
  quantity: number;
  expectedPiecesCount: number;
  quantityReturned: number;
  remainingQuantity: number;
  sewingPricePerPiece: number;
  piecesCost: number | null;
  sewingCost: number | null;
  materialsCost: number | null;
  totalCost: number;
  costPerFinalItem: number | null;
  distributionDate: number;
  status: 'in_distribution' | 'partial_return' | 'fully_returned';
  parts: DistributionBatchPart[];
  consumedMaterials: BatchConsumedMaterial[];
}

export interface DistributionBatchOption {
  id: string;
  modelName: string;
  sizeLabel: string | null;
  color: string | null;
  quantityDistributed: number;
  expectedPiecesCount: number;
  remainingQuantity: number;
  distributionDate: number;
  parts: DistributionBatchPart[];
}

export interface AvailabilityCombination {
  partName: string | null;
  sizeLabel: string;
  color: string;
  notDistributedCount: number;
}

export interface AvailablePartForModel {
  partName: string;
  availableCount: number;
}

export interface AvailablePartWithCost {
  partName: string;
  availableCount: number;
  avgUnitCost: number;
}

export interface PartGivenRow {
  partName: string;
  quantity: number;
  avgUnitCost: number;
  availableCount: number;
}

export interface DistributePartRow {
  partName: string;
  quantity: number;
  avgUnitCost: number;
}

export interface DistributionConsumptionRow {
  stockTransactionId: string;
  quantity: number;
  pricePerUnit: number;
}

export interface Step1Values {
  tailorId: string;
  tailorName: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  expectedFinalQuantity: number;
  sewingPricePerPiece: number;
  distributionDate: string;
  partRows: PartGivenRow[];
  consumedMaterialsCost: number;
  transportationCost: number;
  materialBatchConsumptions: import('@/features/cutting/cutting.types').MaterialBatchConsumption[];
  piecesCost: number;
  sewingCost: number;
  totalCost: number;
  costPerFinalItem: number;
}

export interface DistributePayload {
  tailorId: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  expectedFinalQuantity: number;
  sewingPricePerPiece: number;
  distributionDate: number;
  parts: DistributePartRow[];
  consumptionRows: DistributionConsumptionRow[];
  piecesCost: number;
  sewingCost: number;
  materialsCost: number;
  transportationCost: number;
  totalCost: number;
  costPerFinalItem: number;
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
