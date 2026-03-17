import { contextBridge, ipcRenderer } from 'electron';

const ipcBridge = {
  auth: {
    login: (payload: { username: string; password: string }) =>
      ipcRenderer.invoke('auth:login', payload),
    logout: () => ipcRenderer.invoke('auth:logout'),
    checkSession: (payload?: { token?: string }) =>
      ipcRenderer.invoke('auth:checkSession', payload),
  },
  user: {
    changePassword: (payload: {
      userId: string;
      currentPassword: string;
      newPassword: string;
    }) => ipcRenderer.invoke('user:changePassword', payload),
  },
  stock: {
    getAll: () => ipcRenderer.invoke('stock:getAll'),
    getArchived: () => ipcRenderer.invoke('stock:getArchived'),
    getById: (payload: { id: string }) => ipcRenderer.invoke('stock:getById', payload),
    getTypes: () => ipcRenderer.invoke('stock:getTypes'),
    getUnits: () => ipcRenderer.invoke('stock:getUnits'),
    create: (payload: unknown) => ipcRenderer.invoke('stock:create', payload),
    update: (payload: unknown) => ipcRenderer.invoke('stock:update', payload),
    addInbound: (payload: unknown) => ipcRenderer.invoke('stock:addInbound', payload),
    updateTransaction: (payload: unknown) => ipcRenderer.invoke('stock:updateTransaction', payload),
    checkDuplicate: (payload: { name: string; excludeId?: string }) =>
      ipcRenderer.invoke('stock:checkDuplicate', payload),
    archive: (payload: { id: string }) => ipcRenderer.invoke('stock:archive', payload),
    restore: (payload: { id: string }) => ipcRenderer.invoke('stock:restore', payload),
  },
  employees: {
    getAll: () => ipcRenderer.invoke('employees:getAll'),
    getById: (payload: { id: string }) => ipcRenderer.invoke('employees:getById', payload),
    create: (payload: unknown) => ipcRenderer.invoke('employees:create', payload),
    update: (payload: unknown) => ipcRenderer.invoke('employees:update', payload),
    setStatus: (payload: { id: string; status: string }) => ipcRenderer.invoke('employees:setStatus', payload),
    addOperation: (payload: unknown) => ipcRenderer.invoke('employees:addOperation', payload),
    addPayment: (payload: unknown) => ipcRenderer.invoke('employees:addPayment', payload),
    updatePayment: (payload: unknown) => ipcRenderer.invoke('employees:updatePayment', payload),
    deletePayment: (payload: { id: string }) => ipcRenderer.invoke('employees:deletePayment', payload),
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.off(channel, (_event, ...args) => callback(...args));
  },
};

contextBridge.exposeInMainWorld('ipcBridge', ipcBridge);

declare global {
  interface Window {
    ipcBridge: typeof ipcBridge;
  }
}
