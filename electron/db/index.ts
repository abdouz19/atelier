import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'path';
import * as userSchema from './schema/user';
import * as sessionSchema from './schema/session';
import * as auditLogSchema from './schema/audit_log';
import * as stockItemSchema from './schema/stock_item';
import * as stockTransactionSchema from './schema/stock_transaction';
import * as employeeSchema from './schema/employee';
import * as employeeOperationSchema from './schema/employee_operation';
import * as employeePaymentSchema from './schema/employee_payment';

const schema = { ...userSchema, ...sessionSchema, ...auditLogSchema, ...stockItemSchema, ...stockTransactionSchema, ...employeeSchema, ...employeeOperationSchema, ...employeePaymentSchema };

const dbPath = path.join(app.getPath('userData'), 'atelier.db');
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export function runMigrations(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      avatar_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token TEXT UNIQUE NOT NULL,
      last_accessed INTEGER,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      event_type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      unit TEXT NOT NULL,
      color TEXT,
      image_path TEXT,
      description TEXT,
      notes TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_transactions (
      id TEXT PRIMARY KEY,
      stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
      type TEXT NOT NULL,
      quantity REAL NOT NULL CHECK(quantity > 0),
      color TEXT,
      transaction_date INTEGER NOT NULL,
      notes TEXT,
      source_module TEXT,
      source_reference_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stock_items_is_archived ON stock_items(is_archived);
    CREATE INDEX IF NOT EXISTS idx_stock_items_type ON stock_items(type);
    CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_id ON stock_transactions(stock_item_id);
    CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_date ON stock_transactions(stock_item_id, transaction_date DESC);

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT,
      notes TEXT,
      photo_path TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_operations (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id),
      operation_type TEXT NOT NULL,
      source_module TEXT,
      source_reference_id TEXT,
      operation_date INTEGER NOT NULL,
      quantity REAL NOT NULL CHECK(quantity > 0),
      price_per_unit REAL NOT NULL CHECK(price_per_unit >= 0),
      total_amount REAL NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_payments (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id),
      amount REAL NOT NULL CHECK(amount > 0),
      payment_date INTEGER NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
    CREATE INDEX IF NOT EXISTS idx_employee_ops_employee_date ON employee_operations(employee_id, operation_date DESC);
    CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_date ON employee_payments(employee_id, payment_date DESC);
  `);
}
