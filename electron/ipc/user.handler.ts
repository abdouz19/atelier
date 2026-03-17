import { ipcMain } from 'electron';
import * as UserService from '../features/user/user.service';

export function registerUserHandlers(): void {
  ipcMain.handle(
    'user:changePassword',
    async (
      _event,
      payload: { userId: string; currentPassword: string; newPassword: string },
    ) => {
      try {
        await UserService.changePassword(
          payload.userId,
          payload.currentPassword,
          payload.newPassword,
        );
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
        return { success: false, error: message };
      }
    },
  );
}
