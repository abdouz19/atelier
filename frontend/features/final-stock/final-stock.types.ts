export interface FinalStockKpis {
  totalPieces: number;
  totalDistinctModels: number;
  totalDistinctSizeColorCombos: number;
}

export interface FinalStockRow {
  modelName: string;
  partName: string | null;
  sizeLabel: string;
  color: string;
  currentQuantity: number;
  lastUpdatedDate: number;
  finalCostPerPiece: number | null;
}

export interface FinalStockHistoryEntry {
  id: string;
  sourceType: 'finition' | 'finition_step';
  sourceId: string;
  quantityAdded: number;
  finalCostPerPiece: number | null;
  entryDate: number;
}

export interface FinalStockFilters {
  modelName: string;
  sizeLabel: string;
  color: string;
}
