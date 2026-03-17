export interface CuttingKpis {
  totalSessions: number;
  totalPieces: number;
  piecesNotDistributed: number;
  totalMetersConsumed: number;
  totalCostPaid: number;
}

export interface CuttingSessionSummary {
  id: string;
  sessionDate: number;
  fabricName: string;
  fabricColor: string;
  modelName: string;
  metersUsed: number;
  totalPieces: number;
  employeeNames: string[];
  totalCost: number;
}

export interface CuttingSessionDetail {
  id: string;
  sessionDate: number;
  fabricItemId: string;
  fabricName: string;
  fabricColor: string;
  modelName: string;
  metersUsed: number;
  layers: number;
  pricePerLayer: number;
  notes: string | null;
  totalCost: number;
  employees: Array<{ id: string; name: string; earnings: number }>;
  piecesBySize: Array<{ sizeLabel: string; count: number }>;
  consumptionEntries: Array<{
    stockItemId: string;
    stockItemName: string;
    color: string | null;
    quantity: number;
  }>;
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

export interface PieceRow {
  partName: string;
  sizeName: string;
  quantity: number;
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
  pieceRows: PieceRow[];
  consumptionRows: ConsumptionRow[];
}
