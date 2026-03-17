import { ipcMain } from 'electron';
import * as StockService from '../features/stock/stock.service';

export function registerStockHandlers(): void {
  ipcMain.handle('stock:getAll', () => {
    try {
      return { success: true, data: StockService.getAll() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('stock:getArchived', () => {
    try {
      return { success: true, data: StockService.getArchived() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('stock:getById', (_event, payload: { id: string }) => {
    try {
      return { success: true, data: StockService.getById(payload.id) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('stock:getTypes', () => {
    try {
      return { success: true, data: StockService.getTypes() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('stock:getUnits', () => {
    try {
      return { success: true, data: StockService.getUnits() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('stock:create', (_event, payload: StockService.CreateItemPayload) => {
    try {
      return { success: true, data: StockService.createItem(payload) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('stock:update', (_event, payload: StockService.UpdateItemPayload) => {
    try {
      return { success: true, data: StockService.updateItem(payload) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('stock:addInbound', (_event, payload: StockService.AddInboundPayload) => {
    try {
      return { success: true, data: StockService.addInbound(payload) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle(
    'stock:updateTransaction',
    (_event, payload: StockService.UpdateTransactionPayload) => {
      try {
        return { success: true, data: StockService.updateTransaction(payload) };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
      }
    },
  );

  ipcMain.handle('stock:checkDuplicate', (_event, payload: { name: string; excludeId?: string }) => {
    try {
      return { success: true, data: StockService.checkDuplicateName(payload.name, payload.excludeId) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('stock:archive', (_event, payload: { id: string }) => {
    try {
      StockService.archiveItem(payload.id);
      return { success: true, data: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('stock:restore', (_event, payload: { id: string }) => {
    try {
      StockService.restoreItem(payload.id);
      return { success: true, data: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });
}
