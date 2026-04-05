import type { LoginPayload, ChangePasswordPayload } from '@/features/auth/auth.types';
import type { ThemeMode, PrimaryColor, AppearanceSettings } from '@/features/settings/settings.types';
import type { LookupEntry, CreateLookupPayload, UpdateLookupPayload, DeleteLookupPayload, ModelEntry, PartEntry, SizeEntry } from '@/features/lookups/lookups.types';
import type {
  StockItemSummary,
  StockItemDetail,
  CreateStockItemPayload,
  UpdateStockItemPayload,
  AddInboundPayload,
  UpdateTransactionPayload,
} from '@/features/stock/stock.types';
import type {
  SupplierSummary,
  SupplierDetail,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from '@/features/suppliers/suppliers.types';
import type {
  EmployeeSummary,
  EmployeeDetail,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  SetStatusPayload,
  AddOperationPayload,
  AddPaymentPayload,
  UpdatePaymentPayload,
} from '@/features/employees/employees.types';
import type {
  TailorSummary,
  TailorDetail,
  CreateTailorPayload,
  UpdateTailorPayload,
  AddTailorPaymentPayload,
  UpdateTailorPaymentPayload,
} from '@/features/tailors/tailors.types';
import type {
  DistributionKpis,
  DistributionTailorSummary,
  DistributionTailorDetail,
  DistributionBatchOption,
  DistributionBatchLogRow,
  DistributePayload,
  ReturnPayload,
  AvailablePartForModel,
  AvailablePartWithCost,
} from '@/features/distribution/distribution.types';
import type {
  QcKpis,
  ReturnBatchForQc,
  QcRecordSummary,
  CreateQcPayload,
} from '@/features/qc/qc.types';
import type {
  QcRecordForFinition,
  FinitionRecordSummary,
  CreateFinitionPayload,
  CreateStepPayload,
  AddToFinalStockPayload,
} from '@/features/finition/finition.types';
import type {
  FinalStockKpis,
  FinalStockRow,
  FinalStockHistoryEntry,
  FinalStockFilters,
} from '@/features/final-stock/final-stock.types';
import type {
  DashboardSnapshotData,
  DashboardPeriodKpis,
  DashboardChartData,
} from '@/features/dashboard/dashboard.types';
import type { AvailabilityCombination } from '@/features/distribution/distribution.types';
import type { PiecesAvailabilityRow } from '@/features/pieces/pieces.types';
import type {
  CuttingKpis,
  CuttingSessionSummary,
  CuttingSessionDetail,
  FabricItem,
  FabricColorOption,
  NonFabricItem,
  CreateCuttingSessionPayload,
  PartsInventoryRow,
  FabricBatch,
  MaterialBatch,
} from '@/features/cutting/cutting.types';

function getBridge() {
  if (typeof window === 'undefined' || !window.ipcBridge) {
    throw new Error('ipcBridge is not available. Ensure this runs inside Electron.');
  }
  return window.ipcBridge;
}

export const ipcClient = {
  lookups: {
    getTypes: () => getBridge().lookups.getTypes() as Promise<{ success: true; data: LookupEntry[] } | { success: false; error: string }>,
    getColors: () => getBridge().lookups.getColors() as Promise<{ success: true; data: LookupEntry[] } | { success: false; error: string }>,
    getUnits: () => getBridge().lookups.getUnits() as Promise<{ success: true; data: LookupEntry[] } | { success: false; error: string }>,
    createType: (payload: CreateLookupPayload) => getBridge().lookups.createType(payload) as Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>,
    createColor: (payload: CreateLookupPayload) => getBridge().lookups.createColor(payload) as Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>,
    createUnit: (payload: CreateLookupPayload) => getBridge().lookups.createUnit(payload) as Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>,
    updateType: (payload: UpdateLookupPayload) => getBridge().lookups.updateType(payload) as Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>,
    updateColor: (payload: UpdateLookupPayload) => getBridge().lookups.updateColor(payload) as Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>,
    updateUnit: (payload: UpdateLookupPayload) => getBridge().lookups.updateUnit(payload) as Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>,
    deleteType: (payload: DeleteLookupPayload) => getBridge().lookups.deleteType(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
    deleteColor: (payload: DeleteLookupPayload) => getBridge().lookups.deleteColor(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
    deleteUnit: (payload: DeleteLookupPayload) => getBridge().lookups.deleteUnit(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
    getModels: () => getBridge().lookups.getModels() as Promise<{ success: true; data: ModelEntry[] } | { success: false; error: string }>,
    createModel: (payload: CreateLookupPayload) => getBridge().lookups.createModel(payload) as Promise<{ success: true; data: ModelEntry } | { success: false; error: string }>,
    updateModel: (payload: UpdateLookupPayload) => getBridge().lookups.updateModel(payload) as Promise<{ success: true; data: ModelEntry } | { success: false; error: string }>,
    deleteModel: (payload: DeleteLookupPayload) => getBridge().lookups.deleteModel(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
    getParts: () => getBridge().lookups.getParts() as Promise<{ success: true; data: PartEntry[] } | { success: false; error: string }>,
    createPart: (payload: CreateLookupPayload) => getBridge().lookups.createPart(payload) as Promise<{ success: true; data: PartEntry } | { success: false; error: string }>,
    updatePart: (payload: UpdateLookupPayload) => getBridge().lookups.updatePart(payload) as Promise<{ success: true; data: PartEntry } | { success: false; error: string }>,
    deletePart: (payload: DeleteLookupPayload) => getBridge().lookups.deletePart(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
    getSizes: () => getBridge().lookups.getSizes() as Promise<{ success: true; data: SizeEntry[] } | { success: false; error: string }>,
    createSize: (payload: CreateLookupPayload) => getBridge().lookups.createSize(payload) as Promise<{ success: true; data: SizeEntry } | { success: false; error: string }>,
    updateSize: (payload: UpdateLookupPayload) => getBridge().lookups.updateSize(payload) as Promise<{ success: true; data: SizeEntry } | { success: false; error: string }>,
    deleteSize: (payload: DeleteLookupPayload) => getBridge().lookups.deleteSize(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
  },
  auth: {
    login: (payload: LoginPayload) => getBridge().auth.login(payload),
    logout: () => getBridge().auth.logout(),
    checkSession: (payload?: { token?: string }) => getBridge().auth.checkSession(payload),
  },
  user: {
    changePassword: (payload: ChangePasswordPayload) =>
      getBridge().user.changePassword(payload),
  },
  stock: {
    getAll: () => getBridge().stock.getAll() as Promise<{ success: true; data: StockItemSummary[] } | { success: false; error: string }>,
    getArchived: () => getBridge().stock.getArchived() as Promise<{ success: true; data: StockItemSummary[] } | { success: false; error: string }>,
    getById: (payload: { id: string }) => getBridge().stock.getById(payload) as Promise<{ success: true; data: StockItemDetail } | { success: false; error: string }>,
    create: (payload: CreateStockItemPayload) => getBridge().stock.create(payload) as Promise<{ success: true; data: StockItemSummary } | { success: false; error: string }>,
    update: (payload: UpdateStockItemPayload) => getBridge().stock.update(payload) as Promise<{ success: true; data: StockItemSummary } | { success: false; error: string }>,
    addInbound: (payload: AddInboundPayload) => getBridge().stock.addInbound(payload) as Promise<{ success: true; data: StockItemDetail } | { success: false; error: string }>,
    updateTransaction: (payload: UpdateTransactionPayload) => getBridge().stock.updateTransaction(payload) as Promise<{ success: true; data: StockItemDetail } | { success: false; error: string }>,
    checkDuplicate: (payload: { name: string; excludeId?: string }) => getBridge().stock.checkDuplicate(payload) as Promise<{ success: true; data: boolean } | { success: false; error: string }>,
    archive: (payload: { id: string }) => getBridge().stock.archive(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
    restore: (payload: { id: string }) => getBridge().stock.restore(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
  },
  suppliers: {
    getAll: () => getBridge().suppliers.getAll() as Promise<{ success: true; data: SupplierSummary[] } | { success: false; error: string }>,
    getById: (payload: { id: string }) => getBridge().suppliers.getById(payload) as Promise<{ success: true; data: SupplierDetail } | { success: false; error: string }>,
    create: (payload: CreateSupplierPayload) => getBridge().suppliers.create(payload) as Promise<{ success: true; data: SupplierSummary } | { success: false; error: string }>,
    update: (payload: UpdateSupplierPayload) => getBridge().suppliers.update(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
    delete: (payload: { id: string }) => getBridge().suppliers.delete(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
  },
  employees: {
    getAll: () => getBridge().employees.getAll() as Promise<{ success: true; data: EmployeeSummary[] } | { success: false; error: string }>,
    getById: (payload: { id: string }) => getBridge().employees.getById(payload) as Promise<{ success: true; data: EmployeeDetail } | { success: false; error: string }>,
    create: (payload: CreateEmployeePayload) => getBridge().employees.create(payload) as Promise<{ success: true; data: EmployeeSummary } | { success: false; error: string }>,
    update: (payload: UpdateEmployeePayload) => getBridge().employees.update(payload) as Promise<{ success: true; data: EmployeeSummary } | { success: false; error: string }>,
    setStatus: (payload: SetStatusPayload) => getBridge().employees.setStatus(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
    addOperation: (payload: AddOperationPayload) => getBridge().employees.addOperation(payload) as Promise<{ success: true; data: EmployeeDetail } | { success: false; error: string }>,
    addPayment: (payload: AddPaymentPayload) => getBridge().employees.addPayment(payload) as Promise<{ success: true; data: EmployeeDetail } | { success: false; error: string }>,
    updatePayment: (payload: UpdatePaymentPayload) => getBridge().employees.updatePayment(payload) as Promise<{ success: true; data: EmployeeDetail } | { success: false; error: string }>,
    deletePayment: (payload: { id: string }) => getBridge().employees.deletePayment(payload) as Promise<{ success: true; data: EmployeeDetail } | { success: false; error: string }>,
  },
  cutting: {
    getKpis: () => getBridge().cutting.getKpis() as Promise<{ success: true; data: CuttingKpis } | { success: false; error: string }>,
    getAll: () => getBridge().cutting.getAll() as Promise<{ success: true; data: CuttingSessionSummary[] } | { success: false; error: string }>,
    getById: (payload: { id: string }) => getBridge().cutting.getById(payload) as Promise<{ success: true; data: CuttingSessionDetail } | { success: false; error: string }>,
    getFabrics: () => getBridge().cutting.getFabrics() as Promise<{ success: true; data: FabricItem[] } | { success: false; error: string }>,
    getFabricColors: (payload: { fabricItemId: string }) => getBridge().cutting.getFabricColors(payload) as Promise<{ success: true; data: FabricColorOption[] } | { success: false; error: string }>,
    getNonFabricItems: () => getBridge().cutting.getNonFabricItems() as Promise<{ success: true; data: NonFabricItem[] } | { success: false; error: string }>,
    getModelSuggestions: () => getBridge().cutting.getModelSuggestions() as Promise<{ success: true; data: string[] } | { success: false; error: string }>,
    getPartSuggestions: (payload: { modelName: string }) => getBridge().cutting.getPartSuggestions(payload) as Promise<{ success: true; data: string[] } | { success: false; error: string }>,
    getPartsInventory: () => getBridge().cutting.getPartsInventory() as Promise<{ success: true; data: PartsInventoryRow[] } | { success: false; error: string }>,
    getAvailableSizesForModel: (payload: { modelName: string }) => getBridge().cutting.getAvailableSizesForModel(payload) as Promise<{ success: true; data: string[] } | { success: false; error: string }>,
    getAvailableColorsForModelSize: (payload: { modelName: string; sizeLabel: string }) => getBridge().cutting.getAvailableColorsForModelSize(payload) as Promise<{ success: true; data: string[] } | { success: false; error: string }>,
    create: (payload: CreateCuttingSessionPayload) => getBridge().cutting.create(payload) as Promise<{ success: true; data: CuttingSessionSummary } | { success: false; error: string }>,
    getFabricBatches: (payload: { stockItemId: string; color: string }) => getBridge().cutting.getFabricBatches(payload) as Promise<{ success: true; data: FabricBatch[] } | { success: false; error: string }>,
    getMaterialBatches: (payload: { stockItemId: string; color?: string | null }) => getBridge().cutting.getMaterialBatches(payload) as Promise<{ success: true; data: MaterialBatch[] } | { success: false; error: string }>,
  },
  tailors: {
    getAll: () => getBridge().tailors.getAll() as Promise<{ success: true; data: TailorSummary[] } | { success: false; error: string }>,
    getById: (payload: { id: string }) => getBridge().tailors.getById(payload) as Promise<{ success: true; data: TailorDetail } | { success: false; error: string }>,
    create: (payload: CreateTailorPayload) => getBridge().tailors.create(payload) as Promise<{ success: true; data: TailorSummary } | { success: false; error: string }>,
    update: (payload: UpdateTailorPayload) => getBridge().tailors.update(payload) as Promise<{ success: true; data: TailorSummary } | { success: false; error: string }>,
    setStatus: (payload: { id: string; status: 'active' | 'inactive' }) => getBridge().tailors.setStatus(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
    addPayment: (payload: AddTailorPaymentPayload) => getBridge().tailors.addPayment(payload) as Promise<{ success: true; data: TailorDetail } | { success: false; error: string }>,
    updatePayment: (payload: UpdateTailorPaymentPayload) => getBridge().tailors.updatePayment(payload) as Promise<{ success: true; data: TailorDetail } | { success: false; error: string }>,
    deletePayment: (payload: { id: string }) => getBridge().tailors.deletePayment(payload) as Promise<{ success: true; data: TailorDetail } | { success: false; error: string }>,
  },
  distribution: {
    getKpis: () => getBridge().distribution.getKpis() as Promise<{ success: true; data: DistributionKpis } | { success: false; error: string }>,
    getSummary: () => getBridge().distribution.getSummary() as Promise<{ success: true; data: DistributionTailorSummary[] } | { success: false; error: string }>,
    getDetailByTailor: (payload: { tailorId: string }) => getBridge().distribution.getDetailByTailor(payload) as Promise<{ success: true; data: DistributionTailorDetail } | { success: false; error: string }>,
    getActiveTailors: () => getBridge().distribution.getActiveTailors() as Promise<{ success: true; data: Array<{ id: string; name: string }> } | { success: false; error: string }>,
    getAvailablePartsForModel: (payload: { modelName: string; sizeLabel: string; color: string }) => getBridge().distribution.getAvailablePartsForModel(payload) as Promise<{ success: true; data: AvailablePartForModel[] } | { success: false; error: string }>,
    getModelSuggestions: () => getBridge().distribution.getModelSuggestions() as Promise<{ success: true; data: string[] } | { success: false; error: string }>,
    getBatchesForTailor: (payload: { tailorId: string }) => getBridge().distribution.getBatchesForTailor(payload) as Promise<{ success: true; data: DistributionBatchOption[] } | { success: false; error: string }>,
    getAvailabilityForModel: (payload: { modelName: string }) => getBridge().distribution.getAvailabilityForModel(payload) as Promise<{ success: true; data: AvailabilityCombination[] } | { success: false; error: string }>,
    getModelsWithPieces: () => getBridge().distribution.getModelsWithPieces() as Promise<{ success: true; data: string[] } | { success: false; error: string }>,
    getSizesForModel: (payload: { modelName: string }) => getBridge().distribution.getSizesForModel(payload) as Promise<{ success: true; data: string[] } | { success: false; error: string }>,
    getColorsForModelSize: (payload: { modelName: string; sizeLabel: string }) => getBridge().distribution.getColorsForModelSize(payload) as Promise<{ success: true; data: string[] } | { success: false; error: string }>,
    getPartsWithCostForModelSizeColor: (payload: { modelName: string; sizeLabel: string; color: string }) => getBridge().distribution.getPartsWithCostForModelSizeColor(payload) as Promise<{ success: true; data: AvailablePartWithCost[] } | { success: false; error: string }>,
    distribute: (payload: DistributePayload) => getBridge().distribution.distribute(payload) as Promise<{ success: true; data: DistributionTailorSummary } | { success: false; error: string }>,
    return: (payload: ReturnPayload) => getBridge().distribution.return(payload) as Promise<{ success: true; data: DistributionTailorSummary } | { success: false; error: string }>,
    getAllBatches: () => getBridge().distribution.getAllBatches() as Promise<{ success: true; data: DistributionBatchLogRow[] } | { success: false; error: string }>,
  },
  pieces: {
    getAvailability: (filters?: { modelName?: string; partName?: string; sizeLabel?: string; color?: string }) =>
      getBridge().pieces.getAvailability(filters ?? {}) as Promise<{ success: true; data: PiecesAvailabilityRow[] } | { success: false; error: string }>,
    getLowStockThreshold: () =>
      getBridge().pieces.getLowStockThreshold() as Promise<{ success: true; data: { threshold: number } } | { success: false; error: string }>,
    setLowStockThreshold: (payload: { threshold: number }) =>
      getBridge().pieces.setLowStockThreshold(payload) as Promise<{ success: true; data: null } | { success: false; error: string }>,
  },
  qc: {
    getKpis: () => getBridge().qc.getKpis() as Promise<{ success: true; data: QcKpis } | { success: false; error: string }>,
    getReturnBatchesForQc: () => getBridge().qc.getReturnBatchesForQc() as Promise<{ success: true; data: ReturnBatchForQc[] } | { success: false; error: string }>,
    getRecords: () => getBridge().qc.getRecords() as Promise<{ success: true; data: QcRecordSummary[] } | { success: false; error: string }>,
    create: (payload: CreateQcPayload) => getBridge().qc.create(payload) as Promise<{ success: true; data: { id: string } } | { success: false; error: string }>,
  },
  finition: {
    getQcRecordsForFinition: () => getBridge().finition.getQcRecordsForFinition() as Promise<{ success: true; data: QcRecordForFinition[] } | { success: false; error: string }>,
    getRecords: () => getBridge().finition.getRecords() as Promise<{ success: true; data: FinitionRecordSummary[] } | { success: false; error: string }>,
    create: (payload: CreateFinitionPayload) => getBridge().finition.create(payload) as Promise<{ success: true; data: { id: string } } | { success: false; error: string }>,
    createStep: (payload: CreateStepPayload) => getBridge().finition.createStep(payload) as Promise<{ success: true; data: { id: string } } | { success: false; error: string }>,
    addToFinalStock: (payload: AddToFinalStockPayload) => getBridge().finition.addToFinalStock(payload) as Promise<{ success: true; data: { id: string } } | { success: false; error: string }>,
  },
  finalStock: {
    getKpis: () => getBridge().finalStock.getKpis() as Promise<{ success: true; data: FinalStockKpis } | { success: false; error: string }>,
    getRows: (filters?: Partial<FinalStockFilters>) => getBridge().finalStock.getRows(filters ?? {}) as Promise<{ success: true; data: FinalStockRow[] } | { success: false; error: string }>,
    getHistory: (key: { modelName: string; partName: string | null; sizeLabel: string; color: string }) => getBridge().finalStock.getHistory(key) as Promise<{ success: true; data: FinalStockHistoryEntry[] } | { success: false; error: string }>,
  },
  dashboard: {
    getSnapshotData: () =>
      getBridge().dashboard.getSnapshotData() as Promise<{ success: true; data: DashboardSnapshotData } | { success: false; error: string }>,
    getPeriodKpis: (payload: { startDate: number; endDate: number }) =>
      getBridge().dashboard.getPeriodKpis(payload) as Promise<{ success: true; data: DashboardPeriodKpis } | { success: false; error: string }>,
    getChartData: (payload: { startDate: number; endDate: number; modelName?: string }) =>
      getBridge().dashboard.getChartData(payload) as Promise<{ success: true; data: DashboardChartData } | { success: false; error: string }>,
  },
  settings: {
    getAppearance: () =>
      getBridge().settings.getAppearance() as Promise<
        { success: true; data: AppearanceSettings } | { success: false; error: string }
      >,
    setAppearance: (payload: AppearanceSettings) =>
      getBridge().settings.setAppearance(payload) as Promise<
        { success: true; data: null } | { success: false; error: string }
      >,
    getLogo: () =>
      getBridge().settings.getLogo() as Promise<
        { success: true; data: { logo: string | null } } | { success: false; error: string }
      >,
    setLogo: (payload: { dataUrl: string }) =>
      getBridge().settings.setLogo(payload) as Promise<
        { success: true; data: null } | { success: false; error: string }
      >,
    removeLogo: () =>
      getBridge().settings.removeLogo() as Promise<
        { success: true; data: null } | { success: false; error: string }
      >,
    resetToDefaults: () =>
      getBridge().settings.resetToDefaults() as Promise<
        | { success: true; data: { theme: ThemeMode; primaryColor: PrimaryColor; logo: null } }
        | { success: false; error: string }
      >,
  },
  on: (channel: string, callback: (...args: unknown[]) => void) =>
    getBridge().on(channel, callback),
  off: (channel: string, callback: (...args: unknown[]) => void) =>
    getBridge().off(channel, callback),
};
