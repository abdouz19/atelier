'use client';

import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { ItemType, Color, Unit, ModelEntry, PartEntry, SizeEntry } from '@/features/lookups/lookups.types';

interface UseLookupsResult {
  types: ItemType[];
  colors: Color[];
  units: Unit[];
  models: ModelEntry[];
  parts: PartEntry[];
  sizes: SizeEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createModel: (name: string) => Promise<{ success: boolean; error?: string }>;
  updateModel: (id: string, name: string) => Promise<{ success: boolean; error?: string }>;
  deleteModel: (id: string) => Promise<{ success: boolean; error?: string }>;
  createPart: (name: string) => Promise<{ success: boolean; error?: string }>;
  updatePart: (id: string, name: string) => Promise<{ success: boolean; error?: string }>;
  deletePart: (id: string) => Promise<{ success: boolean; error?: string }>;
  createSize: (name: string) => Promise<{ success: boolean; error?: string }>;
  updateSize: (id: string, name: string) => Promise<{ success: boolean; error?: string }>;
  deleteSize: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function useLookups(): UseLookupsResult {
  const [types, setTypes] = useState<ItemType[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [parts, setParts] = useState<PartEntry[]>([]);
  const [sizes, setSizes] = useState<SizeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      ipcClient.lookups.getTypes(),
      ipcClient.lookups.getColors(),
      ipcClient.lookups.getUnits(),
      ipcClient.lookups.getModels(),
      ipcClient.lookups.getParts(),
      ipcClient.lookups.getSizes(),
    ]).then(([typesRes, colorsRes, unitsRes, modelsRes, partsRes, sizesRes]) => {
      if (cancelled) return;
      setError(null);
      if (typesRes.success) setTypes(typesRes.data); else setError(typesRes.error);
      if (colorsRes.success) setColors(colorsRes.data); else setError(colorsRes.error);
      if (unitsRes.success) setUnits(unitsRes.data); else setError(unitsRes.error);
      if (modelsRes.success) setModels(modelsRes.data); else setError(modelsRes.error);
      if (partsRes.success) setParts(partsRes.data); else setError(partsRes.error);
      if (sizesRes.success) setSizes(sizesRes.data); else setError(sizesRes.error);
      setLoading(false);
    }).catch((err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : 'حدث خطأ');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [tick]);

  async function createModel(name: string) {
    const res = await ipcClient.lookups.createModel({ name });
    if (res.success) refetch();
    return { success: res.success, error: res.success ? undefined : res.error };
  }

  async function updateModel(id: string, name: string) {
    const res = await ipcClient.lookups.updateModel({ id, name });
    if (res.success) refetch();
    return { success: res.success, error: res.success ? undefined : res.error };
  }

  async function deleteModel(id: string) {
    const res = await ipcClient.lookups.deleteModel({ id });
    if (res.success) refetch();
    return { success: res.success, error: res.success ? undefined : res.error };
  }

  async function createPart(name: string) {
    const res = await ipcClient.lookups.createPart({ name });
    if (res.success) refetch();
    return { success: res.success, error: res.success ? undefined : res.error };
  }

  async function updatePart(id: string, name: string) {
    const res = await ipcClient.lookups.updatePart({ id, name });
    if (res.success) refetch();
    return { success: res.success, error: res.success ? undefined : res.error };
  }

  async function deletePart(id: string) {
    const res = await ipcClient.lookups.deletePart({ id });
    if (res.success) refetch();
    return { success: res.success, error: res.success ? undefined : res.error };
  }

  async function createSize(name: string) {
    const res = await ipcClient.lookups.createSize({ name });
    if (res.success) refetch();
    return { success: res.success, error: res.success ? undefined : res.error };
  }

  async function updateSize(id: string, name: string) {
    const res = await ipcClient.lookups.updateSize({ id, name });
    if (res.success) refetch();
    return { success: res.success, error: res.success ? undefined : res.error };
  }

  async function deleteSize(id: string) {
    const res = await ipcClient.lookups.deleteSize({ id });
    if (res.success) refetch();
    return { success: res.success, error: res.success ? undefined : res.error };
  }

  return {
    types, colors, units, models, parts, sizes,
    loading, error, refetch,
    createModel, updateModel, deleteModel,
    createPart, updatePart, deletePart,
    createSize, updateSize, deleteSize,
  };
}
