export interface PiecesAvailabilityRow {
  modelName: string;
  partName: string | null;
  sizeLabel: string;
  color: string;
  totalProduced: number;
  notDistributed: number;
  inDistribution: number;
  returned: number;
}

export interface CriticalCombination {
  modelName: string;
  partName: string | null;
  sizeLabel: string;
  color: string;
  notDistributed: number;
}
