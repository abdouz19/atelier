import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Reference-only schema — not executed at runtime. Actual table managed by electron/main.js.
// Aggregate inventory table: one row per (model_name, size_label, color, part_name).
// UNIQUE(model_name, size_label, color, part_name) — upserted on each cutting session create.
export const cuttingParts = sqliteTable('cutting_parts', {
  id: text('id').primaryKey(),
  model_name: text('model_name').notNull(),
  size_label: text('size_label').notNull().default(''),
  color: text('color').notNull().default(''),
  part_name: text('part_name').notNull(),
  count: integer('count').notNull().default(0),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

export type CuttingPart = typeof cuttingParts.$inferSelect;
export type NewCuttingPart = typeof cuttingParts.$inferInsert;
