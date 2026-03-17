import { ipcMain } from 'electron';
import * as EmployeeService from '../features/employees/employees.service';

export function registerEmployeesHandlers(): void {
  ipcMain.handle('employees:getAll', () => {
    try {
      return { success: true, data: EmployeeService.getAll() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('employees:getById', (_event, payload: { id: string }) => {
    try {
      return { success: true, data: EmployeeService.getEmployeeById(payload.id) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('employees:create', (_event, payload: EmployeeService.CreateEmployeePayload) => {
    try {
      return { success: true, data: EmployeeService.createEmployee(payload) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('employees:update', (_event, payload: EmployeeService.UpdateEmployeePayload) => {
    try {
      return { success: true, data: EmployeeService.updateEmployee(payload) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('employees:setStatus', (_event, payload: EmployeeService.SetStatusPayload) => {
    try {
      EmployeeService.setStatus(payload);
      return { success: true, data: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('employees:addOperation', (_event, payload: EmployeeService.AddOperationPayload) => {
    try {
      return { success: true, data: EmployeeService.addOperation(payload) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('employees:addPayment', (_event, payload: EmployeeService.AddPaymentPayload) => {
    try {
      return { success: true, data: EmployeeService.addPayment(payload) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('employees:updatePayment', (_event, payload: EmployeeService.UpdatePaymentPayload) => {
    try {
      return { success: true, data: EmployeeService.updatePayment(payload) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });

  ipcMain.handle('employees:deletePayment', (_event, payload: { id: string }) => {
    try {
      return { success: true, data: EmployeeService.deletePayment(payload) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  });
}
