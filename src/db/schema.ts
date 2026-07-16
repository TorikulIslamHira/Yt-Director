import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
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

// id doubles as the owning user's id (was a single hardcoded "global" row
// before multi-user support, 2026-07-16).
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  readingSpeedBn: integer("reading_speed_bn").notNull().default(120),
  readingSpeedEn: integer("reading_speed_en").notNull().default(150),
});

export type SettingsRow = typeof settings.$inferSelect;

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: integer("is_admin").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export type UserRow = typeof users.$inferSelect;

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export type SessionRow = typeof sessions.$inferSelect;

export const userApiKeys = sqliteTable("user_api_keys", {
  userId: text("user_id").primaryKey(),
  geminiKeyEnc: text("gemini_key_enc"),
  groqKeyEnc: text("groq_key_enc"),
  pexelsKeyEnc: text("pexels_key_enc"),
  pixabayKeyEnc: text("pixabay_key_enc"),
  telegramBotTokenEnc: text("telegram_bot_token_enc"),
  telegramChatIdEnc: text("telegram_chat_id_enc"),
  updatedAt: integer("updated_at").notNull(),
});

export type UserApiKeysRow = typeof userApiKeys.$inferSelect;

export const scriptTemplates = sqliteTable("script_templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  scriptText: text("script_text").notNull(),
  createdAt: integer("created_at").notNull(),
});

export type ScriptTemplateRow = typeof scriptTemplates.$inferSelect;

export const projectShareLinks = sqliteTable("project_share_links", {
  token: text("token").primaryKey(),
  projectId: text("project_id").notNull().unique(),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at").notNull(),
});

export type ProjectShareLinkRow = typeof projectShareLinks.$inferSelect;
