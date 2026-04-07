import type { LookupEntry, CreateLookupPayload, UpdateLookupPayload, DeleteLookupPayload, ModelEntry, PartEntry, SizeEntry } from '@/features/lookups/lookups.types';

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
}

export type IpcResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface LoginPayload {
  username: string;
  password: string;
}

export interface ChangePasswordPayload {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

declare global {
  interface Window {
    ipcBridge: {
      auth: {
        login: (payload: LoginPayload) => Promise<IpcResponse<{ user: User; sessionToken: string }>>;
        logout: () => Promise<IpcResponse<void>>;
        checkSession: (payload?: { token?: string }) => Promise<IpcResponse<{ user: User }>>;
      };
      user: {
        changePassword: (payload: ChangePasswordPayload) => Promise<IpcResponse<void>>;
      };
      lookups: {
        getTypes: () => Promise<{ success: true; data: LookupEntry[] } | { success: false; error: string }>;
        getColors: () => Promise<{ success: true; data: LookupEntry[] } | { success: false; error: string }>;
        getUnits: () => Promise<{ success: true; data: LookupEntry[] } | { success: false; error: string }>;
        createType: (payload: CreateLookupPayload) => Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>;
        createColor: (payload: CreateLookupPayload) => Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>;
        createUnit: (payload: CreateLookupPayload) => Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>;
        updateType: (payload: UpdateLookupPayload) => Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>;
        updateColor: (payload: UpdateLookupPayload) => Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>;
        updateUnit: (payload: UpdateLookupPayload) => Promise<{ success: true; data: LookupEntry } | { success: false; error: string }>;
        deleteType: (payload: DeleteLookupPayload) => Promise<{ success: true; data: null } | { success: false; error: string }>;
        deleteColor: (payload: DeleteLookupPayload) => Promise<{ success: true; data: null } | { success: false; error: string }>;
        deleteUnit: (payload: DeleteLookupPayload) => Promise<{ success: true; data: null } | { success: false; error: string }>;
        getModels: () => Promise<{ success: true; data: ModelEntry[] } | { success: false; error: string }>;
        createModel: (payload: CreateLookupPayload) => Promise<{ success: true; data: ModelEntry } | { success: false; error: string }>;
        updateModel: (payload: UpdateLookupPayload) => Promise<{ success: true; data: ModelEntry } | { success: false; error: string }>;
        deleteModel: (payload: DeleteLookupPayload) => Promise<{ success: true; data: null } | { success: false; error: string }>;
        getParts: () => Promise<{ success: true; data: PartEntry[] } | { success: false; error: string }>;
        createPart: (payload: CreateLookupPayload) => Promise<{ success: true; data: PartEntry } | { success: false; error: string }>;
        updatePart: (payload: UpdateLookupPayload) => Promise<{ success: true; data: PartEntry } | { success: false; error: string }>;
        deletePart: (payload: DeleteLookupPayload) => Promise<{ success: true; data: null } | { success: false; error: string }>;
        getSizes: () => Promise<{ success: true; data: SizeEntry[] } | { success: false; error: string }>;
        createSize: (payload: CreateLookupPayload) => Promise<{ success: true; data: SizeEntry } | { success: false; error: string }>;
        updateSize: (payload: UpdateLookupPayload) => Promise<{ success: true; data: SizeEntry } | { success: false; error: string }>;
        deleteSize: (payload: DeleteLookupPayload) => Promise<{ success: true; data: null } | { success: false; error: string }>;
      };
      stock: {
        getAll: () => Promise<unknown>;
        getArchived: () => Promise<unknown>;
        getById: (payload: { id: string }) => Promise<unknown>;
        create: (payload: unknown) => Promise<unknown>;
        update: (payload: unknown) => Promise<unknown>;
        addInbound: (payload: unknown) => Promise<unknown>;
        updateTransaction: (payload: unknown) => Promise<unknown>;
        checkDuplicate: (payload: { name: string; excludeId?: string }) => Promise<unknown>;
        archive: (payload: { id: string }) => Promise<unknown>;
        restore: (payload: { id: string }) => Promise<unknown>;
      };
      suppliers: {
        getAll: () => Promise<unknown>;
        getById: (payload: { id: string }) => Promise<unknown>;
        create: (payload: unknown) => Promise<unknown>;
        update: (payload: unknown) => Promise<unknown>;
        delete: (payload: { id: string }) => Promise<unknown>;
      };
      employees: {
        getAll: () => Promise<unknown>;
        getById: (payload: { id: string }) => Promise<unknown>;
        create: (payload: unknown) => Promise<unknown>;
        update: (payload: unknown) => Promise<unknown>;
        setStatus: (payload: { id: string; status: string }) => Promise<unknown>;
        addOperation: (payload: unknown) => Promise<unknown>;
        addPayment: (payload: unknown) => Promise<unknown>;
        updatePayment: (payload: unknown) => Promise<unknown>;
        deletePayment: (payload: { id: string }) => Promise<unknown>;
      };
      cutting: {
        getKpis: () => Promise<unknown>;
        getAll: () => Promise<unknown>;
        getById: (payload: { id: string }) => Promise<unknown>;
        getFabrics: () => Promise<unknown>;
        getFabricColors: (payload: { fabricItemId: string }) => Promise<unknown>;
        getNonFabricItems: () => Promise<unknown>;
        getModelSuggestions: () => Promise<unknown>;
        getPartSuggestions: (payload: { modelName: string }) => Promise<unknown>;
        getPartsInventory: () => Promise<unknown>;
        getSessionsWithParts: () => Promise<unknown>;
        getAvailableSizesForModel: (payload: { modelName: string }) => Promise<unknown>;
        getAvailableColorsForModelSize: (payload: { modelName: string; sizeLabel: string }) => Promise<unknown>;
        create: (payload: unknown) => Promise<unknown>;
        getFabricBatches: (payload: { stockItemId: string; color: string }) => Promise<unknown>;
        getMaterialBatches: (payload: { stockItemId: string; color?: string | null }) => Promise<unknown>;
      };
      tailors: {
        getAll: () => Promise<unknown>;
        getById: (payload: { id: string }) => Promise<unknown>;
        create: (payload: unknown) => Promise<unknown>;
        update: (payload: unknown) => Promise<unknown>;
        setStatus: (payload: { id: string; status: string }) => Promise<unknown>;
        addPayment: (payload: unknown) => Promise<unknown>;
        updatePayment: (payload: unknown) => Promise<unknown>;
        deletePayment: (payload: { id: string }) => Promise<unknown>;
      };
      distribution: {
        getKpis: () => Promise<unknown>;
        getSummary: () => Promise<unknown>;
        getDetailByTailor: (payload: { tailorId: string }) => Promise<unknown>;
        getActiveTailors: () => Promise<unknown>;
        getAvailablePartsForModel: (payload: { modelName: string; sizeLabel: string; color: string }) => Promise<unknown>;
        getAvailabilityForModel: (payload: { modelName: string }) => Promise<unknown>;
        getModelSuggestions: () => Promise<unknown>;
        getBatchesForTailor: (payload: { tailorId: string }) => Promise<unknown>;
        getModelsWithPieces: () => Promise<unknown>;
        getSizesForModel: (payload: { modelName: string }) => Promise<unknown>;
        getColorsForModelSize: (payload: { modelName: string; sizeLabel: string }) => Promise<unknown>;
        getPartsWithCostForModelSizeColor: (payload: { modelName: string; sizeLabel: string; color: string }) => Promise<unknown>;
        distribute: (payload: unknown) => Promise<unknown>;
        return: (payload: unknown) => Promise<unknown>;
        getAllBatches: () => Promise<unknown>;
      };
      pieces: {
        getAvailability: (payload: unknown) => Promise<unknown>;
        getLowStockThreshold: () => Promise<unknown>;
        setLowStockThreshold: (payload: unknown) => Promise<unknown>;
      };
      qc: {
        getKpis: () => Promise<unknown>;
        getReturnBatchesForQc: () => Promise<unknown>;
        getRecords: () => Promise<unknown>;
        create: (payload: unknown) => Promise<unknown>;
      };
      finition: {
        getQcRecordsForFinition: () => Promise<unknown>;
        getRecords: () => Promise<unknown>;
        create: (payload: unknown) => Promise<unknown>;
        createStep: (payload: unknown) => Promise<unknown>;
        addToFinalStock: (payload: unknown) => Promise<unknown>;
      };
      finalStock: {
        getKpis: () => Promise<unknown>;
        getRows: (payload: unknown) => Promise<unknown>;
        getHistory: (payload: unknown) => Promise<unknown>;
      };
      dashboard: {
        getSnapshotData: () => Promise<unknown>;
        getPeriodKpis: (payload: unknown) => Promise<unknown>;
        getChartData: (payload: unknown) => Promise<unknown>;
      };
      settings: {
        getAppearance: () => Promise<unknown>;
        setAppearance: (payload: unknown) => Promise<unknown>;
        getLogo: () => Promise<unknown>;
        setLogo: (payload: { dataUrl: string }) => Promise<unknown>;
        removeLogo: () => Promise<unknown>;
        resetToDefaults: () => Promise<unknown>;
      };
      on: (channel: string, callback: (...args: unknown[]) => void) => void;
      off: (channel: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
