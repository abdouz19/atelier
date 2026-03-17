import { ipcMain } from 'electron';
import * as AuthService from '../features/auth/auth.service';

let currentToken: string | null = null;

export function setCurrentToken(token: string): void {
  currentToken = token;
}

export function clearCurrentToken(): void {
  currentToken = null;
}

export function registerAuthHandlers(): void {
  ipcMain.handle(
    'auth:login',
    async (_event, payload: { username: string; password: string }) => {
      try {
        const result = await AuthService.login(payload.username, payload.password);
        setCurrentToken(result.sessionToken);
        return { success: true, data: { user: result.user, sessionToken: result.sessionToken } };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
        return { success: false, error: message };
      }
    },
  );

  ipcMain.handle('auth:logout', async () => {
    try {
      if (currentToken) {
        await AuthService.logout(currentToken);
        clearCurrentToken();
      }
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      return { success: false, error: message };
    }
  });

  ipcMain.handle(
    'auth:checkSession',
    (_event, payload?: { token?: string }) => {
      try {
        const token = payload?.token ?? currentToken;
        if (!token) return { success: false, error: 'لا توجد جلسة نشطة' };

        const result = AuthService.checkSession(token);
        if (!result) return { success: false, error: 'انتهت صلاحية الجلسة' };

        setCurrentToken(token);
        return { success: true, data: { user: result.user } };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
        return { success: false, error: message };
      }
    },
  );
}
