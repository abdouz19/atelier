import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const return_records = sqliteTable('return_records', {
  id: text('id').primaryKey(),
  batch_id: text('batch_id').notNull(),
  quantity_returned: integer('quantity_returned').notNull(),
  return_date: integer('return_date').notNull(),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

export type ReturnRecord = typeof return_records.$inferSelect;
export type NewReturnRecord = typeof return_records.$inferInsert;
