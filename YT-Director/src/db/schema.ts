import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  scriptText: text("script_text").notNull(),
  scenes: text("scenes").notNull().default("[]"),
  bgm: text("bgm"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
