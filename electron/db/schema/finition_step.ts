// Reference-only Drizzle schema — NOT executed at runtime
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { finitionRecords } from './finition_record';
import { employees } from './employee';

export const finitionSteps = sqliteTable('finition_steps', {
  id: text('id').primaryKey(),
  finitionId: text('finition_id').notNull().references(() => finitionRecords.id),
  stepOrder: integer('step_order').notNull(),
  stepName: text('step_name').notNull(),
  employeeId: text('employee_id').references(() => employees.id),
  quantity: integer('quantity').notNull(),
  pricePerPiece: real('price_per_piece'),
  totalCost: real('total_cost'),
  stepDate: integer('step_date').notNull(),
  isReady: integer('is_ready').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const finitionStepConsumptionEntries = sqliteTable('finition_step_consumption_entries', {
  id: text('id').primaryKey(),
  stepId: text('step_id').notNull().references(() => finitionSteps.id),
  stockItemId: text('stock_item_id').notNull(),
  color: text('color'),
  quantity: real('quantity').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
