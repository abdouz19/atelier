import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { employees } from './employee';

export const employeeOperations = sqliteTable('employee_operations', {
  id: text('id').primaryKey(),
  employee_id: text('employee_id').notNull().references(() => employees.id),
  operation_type: text('operation_type').notNull(), // 'cutting' | 'distribution' | 'qc' | 'finition' | 'custom'
  source_module: text('source_module'), // null for manual entries
  source_reference_id: text('source_reference_id'), // null for manual entries
  model_name: text('model_name'),
  part_name: text('part_name'), // cutting only; null for other operation types
  color: text('color'),
  operation_date: integer('operation_date', { mode: 'timestamp_ms' }).notNull(),
  quantity: real('quantity').notNull(),
  price_per_unit: real('price_per_unit').notNull(),
  total_amount: real('total_amount').notNull(), // quantity × price_per_unit, stored at write time
  notes: text('notes'),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type EmployeeOperation = typeof employeeOperations.$inferSelect;
export type NewEmployeeOperation = typeof employeeOperations.$inferInsert;
