import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tailors = sqliteTable('tailors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  status: text('status').notNull().default('active'), // 'active' | 'inactive'
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

export type Tailor = typeof tailors.$inferSelect;
export type NewTailor = typeof tailors.$inferInsert;
