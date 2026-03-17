export interface FabricItemKpi {
  name: string;
  availableMeters: number;
}

export interface DashboardSnapshotKpis {
  fabricItems: FabricItemKpi[];
  zeroStockNonFabricCount: number;
  piecesNotDistributed: number;
  piecesInDistribution: number;
  piecesAwaitingQc: number;
  piecesAwaitingFinition: number;
  piecesInFinition: number;
  piecesInFinalStock: number;
  activeTailorsWithPendingDistributions: number;
  zeroStockCombosCount: number;
  lowStockCombosCount: number;
}

export interface DashboardPeriodKpis {
  totalEmployeeDebt: number;
  totalPurchases: number;
}

export interface PipelineStage {
  label: string;
  count: number;
  href: string;
}

export interface ActivityEntry {
  id: string;
  type: 'cutting_session' | 'distribution' | 'return' | 'qc' | 'finition' | 'final_stock';
  modelName: string | null;
  eventDate: number;
}

export interface CriticalCombination {
  modelName: string;
  partName: string | null;
  sizeLabel: string;
  color: string;
  notDistributed: number;
}

export interface DashboardSnapshotData {
  kpis: DashboardSnapshotKpis;
  pipeline: PipelineStage[];
  activity: ActivityEntry[];
  criticalCombinations: CriticalCombination[];
}

export interface MonthlyProductionPoint {
  month: string;
  pieces: number;
}

export interface TopTailorPoint {
  name: string;
  returned: number;
}

export interface TopModelPoint {
  modelName: string;
  pieces: number;
}

export interface FabricConsumptionRawPoint {
  fabricName: string;
  month: string;
  metersConsumed: number;
}

export interface FabricConsumptionPoint {
  month: string;
  [fabricName: string]: number | string;
}

export interface EmployeeDebtPoint {
  name: string;
  balance: number;
}

export interface MonthlyDistributedPoint {
  month: string;
  distributed: number;
}

export interface DashboardChartData {
  monthlyProduction: MonthlyProductionPoint[];
  monthlyDistributed: MonthlyDistributedPoint[];
  topTailors: TopTailorPoint[];
  topModels: TopModelPoint[];
  fabricConsumption: FabricConsumptionRawPoint[];
  employeeDebt: EmployeeDebtPoint[];
}

export interface DashboardFilters {
  startDate: number;
  endDate: number;
  modelName: string;
}
