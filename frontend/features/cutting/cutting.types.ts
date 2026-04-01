export interface CuttingKpis {
  totalSessions: number;
  totalPartsProduced: number;
  totalPartsAvailable: number;
  totalMetersConsumed: number;
  totalCostPaid: number;
}

export interface CuttingSessionSummary {
  id: string;
  sessionDate: number;
  fabricName: string;
  fabricColor: string;
  modelName: string;
  sizeLabel: string;
  metersUsed: number;
  totalPieces: number;
  employeeNames: string[];
  totalCost: number;
}

export interface PartRow {
  partName: string;
  sizeLabel: string;
  count: number;
}

export interface CuttingSessionDetail {
  id: string;
  sessionDate: number;
  fabricItemId: string;
  fabricName: string;
  fabricColor: string;
  modelName: string;
  sizeLabel: string;
  metersUsed: number;
  layers: number;
  pricePerLayer: number;
  notes: string | null;
  totalCost: number;
  fabricCost: number | null;
  employeeCost: number | null;
  consumedMaterialsCost: number | null;
  totalSessionCost: number | null;
  employees: Array<{ id: string; name: string; earnings: number }>;
  parts: PartRow[];
  consumptionEntries: Array<{
    stockItemId: string;
    stockItemName: string;
    color: string | null;
    quantity: number;
  }>;
}

export interface PartsInventoryRow {
  modelName: string;
  sizeLabel: string;
  color: string;
  partName: string;
  totalProduced: number;
  totalDistributed: number;
  availableCount: number;
}

export interface FabricColorOption {
  color: string;
  available: number;
}

export interface FabricItem {
  id: string;
  name: string;
  colors: FabricColorOption[];
}

export interface NonFabricItem {
  id: string;
  name: string;
  unit: string;
  colors: Array<{ color: string; available: number }>;
  totalAvailable: number;
}

export interface ConsumptionRow {
  stockItemId: string;
  color: string | null;
  quantity: number;
}

// ─── Batch cost types (018-session-cost-distribution) ─────────────────────────

export interface FabricBatch {
  transactionId: string;
  transactionDate: number;
  pricePerMeter: number;
  originalQuantity: number;
  availableQuantity: number;
  supplierName: string | null;
}

export interface MaterialBatch {
  transactionId: string;
  transactionDate: number;
  pricePerUnit: number;
  unit: string;
  originalQuantity: number;
  availableQuantity: number;
  supplierName: string | null;
}

export interface FabricBatchEntry {
  transactionId: string;
  quantity: number;
  pricePerUnit: number;
  availableQuantity: number;
}

export interface MaterialBatchEntry {
  transactionId: string;
  quantity: number;
  pricePerUnit: number;
  availableQuantity: number;
}

export interface MaterialBatchConsumption {
  stockItemId: string;
  color: string | null;
  batches: MaterialBatchEntry[];
}

export interface PartCost {
  partName: string;
  sizeLabel: string;
  unitCost: number;
}

export type CostDistributionLockState = 'auto' | 'locked';

export interface CostDistributionRow {
  partName: string;
  sizeLabel: string;
  count: number;
  unitCost: number;
  lockState: CostDistributionLockState;
}

export interface CreateCuttingSessionPayload {
  fabricItemId: string;
  fabricColor: string;
  modelName: string;
  metersUsed: number;
  employeeIds: string[];
  layers: number;
  pricePerLayer: number;
  sessionDate: number;
  notes?: string;
  parts: PartRow[];
  consumptionRows: ConsumptionRow[];
  // Cost fields (018-session-cost-distribution)
  fabricBatchConsumptions: FabricBatchEntry[];
  materialBatchConsumptions: MaterialBatchConsumption[];
  fabricCost: number;
  employeeCost: number;
  consumedMaterialsCost: number;
  totalSessionCost: number;
  partCosts: PartCost[];
}
