import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  scriptText: text("script_text").notNull(),
  scenes: text("scenes").notNull().default("[]"),
  bgm: text("bgm"),
  status: text("status").notNull().default("draft"),
  // Deprecated single-link fields, kept only so old rows written before
  // multi-link support (2026-07-16) still read back correctly.
  postedUrl: text("posted_url"),
  postedPlatform: text("posted_platform"),
  postedLinks: text("posted_links").notNull().default("[]"),
  completedAt: integer("completed_at"),
  generationStatus: text("generation_status").notNull().default("idle"),
  generationError: text("generation_error"),
  previousVersions: text("previous_versions").notNull().default("[]"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;

// Single global row (id = "global") — this is a single-editor tool, no
// per-user settings needed.
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  readingSpeedBn: integer("reading_speed_bn").notNull().default(120),
  readingSpeedEn: integer("reading_speed_en").notNull().default(150),
});

export type SettingsRow = typeof settings.$inferSelect;
