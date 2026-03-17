import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const models = sqliteTable('models', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isPredefined: integer('is_predefined').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
