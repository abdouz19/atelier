import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { employees } from './employee';

export const employeePayments = sqliteTable('employee_payments', {
  id: text('id').primaryKey(),
  employee_id: text('employee_id').notNull().references(() => employees.id),
  amount: real('amount').notNull(),
  payment_date: integer('payment_date', { mode: 'timestamp_ms' }).notNull(),
  notes: text('notes'),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type EmployeePayment = typeof employeePayments.$inferSelect;
export type NewEmployeePayment = typeof employeePayments.$inferInsert;
