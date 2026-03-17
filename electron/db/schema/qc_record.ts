// Reference-only Drizzle schema — NOT executed at runtime (better-sqlite3 plain JS used instead)
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { returnRecords } from './return_record';
import { employees } from './employee';

export const qcRecords = sqliteTable('qc_records', {
  id: text('id').primaryKey(),
  returnId: text('return_id').notNull().references(() => returnRecords.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  quantityReviewed: integer('quantity_reviewed').notNull(),
  qtyDamaged: integer('qty_damaged').notNull().default(0),
  qtyAcceptable: integer('qty_acceptable').notNull().default(0),
  qtyGood: integer('qty_good').notNull().default(0),
  qtyVeryGood: integer('qty_very_good').notNull().default(0),
  pricePerPiece: real('price_per_piece').notNull(),
  totalCost: real('total_cost').notNull(),
  reviewDate: integer('review_date').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const qcConsumptionEntries = sqliteTable('qc_consumption_entries', {
  id: text('id').primaryKey(),
  qcId: text('qc_id').notNull().references(() => qcRecords.id),
  stockItemId: text('stock_item_id').notNull(),
  color: text('color'),
  quantity: real('quantity').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
