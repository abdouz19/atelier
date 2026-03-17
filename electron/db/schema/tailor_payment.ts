import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const tailor_payments = sqliteTable('tailor_payments', {
  id: text('id').primaryKey(),
  tailor_id: text('tailor_id').notNull().references(() => { throw new Error('FK') }),
  amount: real('amount').notNull(),
  payment_date: integer('payment_date').notNull(),
  notes: text('notes'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

export type TailorPayment = typeof tailor_payments.$inferSelect;
export type NewTailorPayment = typeof tailor_payments.$inferInsert;
