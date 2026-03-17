'use client';

import { ipcClient } from '@/lib/ipc-client';
import type {
  AddInboundPayload,
  UpdateTransactionPayload,
  UpdateStockItemPayload,
} from '@/features/stock/stock.types';

export function useStockMutations() {
  async function addInbound(payload: AddInboundPayload) {
    return ipcClient.stock.addInbound(payload);
  }

  async function updateTransaction(payload: UpdateTransactionPayload) {
    return ipcClient.stock.updateTransaction(payload);
  }

  async function archiveItem(id: string) {
    return ipcClient.stock.archive({ id });
  }

  async function restoreItem(id: string) {
    return ipcClient.stock.restore({ id });
  }

  async function updateItem(payload: UpdateStockItemPayload) {
    return ipcClient.stock.update(payload);
  }

  return { addInbound, updateTransaction, archiveItem, restoreItem, updateItem };
}
