import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { AvailabilityCombination } from '@/features/distribution/distribution.types';

export function useDistributeForm() {
  const [tailorId, setTailorId] = useState('');
  const [modelName, setModelName] = useState('');
  const [availabilityCombinations, setAvailabilityCombinations] = useState<AvailabilityCombination[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<AvailabilityCombination | null>(null);
  const [isLoadingCombinations, setIsLoadingCombinations] = useState(false);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [activeTailors, setActiveTailors] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    ipcClient.distribution.getModelSuggestions().then(res => {
      if (res.success) setModelSuggestions(res.data);
    });
    ipcClient.distribution.getActiveTailors().then(res => {
      if (res.success) setActiveTailors(res.data);
    });
  }, []);

  const fetchCombinations = useCallback(async (model: string) => {
    if (!model) { setAvailabilityCombinations([]); setSelectedCombination(null); return; }
    setIsLoadingCombinations(true);
    try {
      const res = await ipcClient.distribution.getAvailabilityForModel({ modelName: model });
      if (res.success) setAvailabilityCombinations(res.data);
    } finally {
      setIsLoadingCombinations(false);
    }
  }, []);

  const handleSetModelName = useCallback((name: string) => {
    setModelName(name);
    setSelectedCombination(null);
    fetchCombinations(name);
  }, [fetchCombinations]);

  const selectCombination = useCallback((combo: AvailabilityCombination | null) => {
    setSelectedCombination(combo);
  }, []);

  return {
    tailorId, setTailorId,
    modelName, setModelName: handleSetModelName,
    availabilityCombinations,
    selectedCombination, selectCombination,
    isLoadingCombinations,
    modelSuggestions, activeTailors,
  };
}
