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
}
