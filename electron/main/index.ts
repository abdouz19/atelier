import { app, BrowserWindow } from 'electron';
import path from 'path';
import { runMigrations } from '../db/index';
import { registerAuthHandlers } from '../ipc/auth.handler';
import { registerUserHandlers } from '../ipc/user.handler';
import { registerStockHandlers } from '../ipc/stock.handler';
import { registerEmployeesHandlers } from '../ipc/employees.handler';
import { seedAdminIfEmpty } from '../features/auth/auth.service';

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../frontend/out/index.html'));
  }
}

app.whenReady().then(async () => {
  runMigrations();
  await seedAdminIfEmpty();

  registerAuthHandlers();
  registerUserHandlers();
  registerStockHandlers();
  registerEmployeesHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
