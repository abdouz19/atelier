// Reference-only Drizzle schema — NOT executed at runtime
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { qcRecords } from './qc_record';
import { employees } from './employee';

export const finitionRecords = sqliteTable('finition_records', {
  id: text('id').primaryKey(),
  qcId: text('qc_id').notNull().references(() => qcRecords.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  quantity: integer('quantity').notNull(),
  pricePerPiece: real('price_per_piece').notNull(),
  totalCost: real('total_cost').notNull(),
  finitionDate: integer('finition_date').notNull(),
  isReady: integer('is_ready').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const finitionConsumptionEntries = sqliteTable('finition_consumption_entries', {
  id: text('id').primaryKey(),
  finitionId: text('finition_id').notNull().references(() => finitionRecords.id),
  stockItemId: text('stock_item_id').notNull(),
  color: text('color'),
  quantity: real('quantity').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
