import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const parts = sqliteTable('parts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isPredefined: integer('is_predefined').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export type Part = typeof parts.$inferSelect;
export type NewPart = typeof parts.$inferInsert;
