import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const sizes = sqliteTable('sizes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isPredefined: integer('is_predefined').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export type Size = typeof sizes.$inferSelect;
export type NewSize = typeof sizes.$inferInsert;
