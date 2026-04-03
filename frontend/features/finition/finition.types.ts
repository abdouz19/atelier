import type { ConsumptionEntryInput } from '@/features/qc/qc.types';

export interface QcRecordForFinition {
  qcId: string;
  returnId: string;
  tailorName: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  reviewDate: number;
  costPerPieceAfterQc: number | null;
  finitionableTotal: number;
  finitionedSoFar: number;
  finitionableRemaining: number;
}

export interface FinitionStepSummary {
  id: string;
  stepOrder: number;
  stepName: string;
  employeeName: string | null;
  quantity: number;
  stepDate: number;
  isReady: boolean;
}

export interface FinitionRecordSummary {
  id: string;
  qcId: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  employeeName: string;
  finitionDate: number;
  quantity: number;
  pricePerPiece: number;
  totalCost: number;
  isReady: boolean;
  steps: FinitionStepSummary[];
}

export interface CreateFinitionPayload {
  qcId: string;
  employeeId: string;
  quantity: number;
  pricePerPiece: number;
  finitionDate: number;
  consumptionEntries?: ConsumptionEntryInput[];
  materialBatchConsumptions?: import('@/features/cutting/cutting.types').MaterialBatchConsumption[];
}

export interface CreateStepPayload {
  finitionId: string;
  stepName: string;
  quantity: number;
  employeeId?: string;
  pricePerPiece?: number;
  stepDate: number;
  consumptionEntries?: ConsumptionEntryInput[];
  materialBatchConsumptions?: import('@/features/cutting/cutting.types').MaterialBatchConsumption[];
}

export interface AddToFinalStockPayload {
  sourceType: 'finition' | 'finition_step';
  sourceId: string;
  modelName: string;
  partName?: string;
  sizeLabel: string;
  color: string;
  quantity: number;
  entryDate: number;
}
