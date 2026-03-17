'use client';

import { create } from 'zustand';

interface StockUIState {
  // Controlled from URL params, but also mirrored here for components
  // that need to read without useSearchParams
  activeTab: 'active' | 'archived';
  setActiveTab: (tab: 'active' | 'archived') => void;
}

export const useStockStore = create<StockUIState>((set) => ({
  activeTab: 'active',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
