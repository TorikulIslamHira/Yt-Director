import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { hashPassword, encryptSecret } from "@/lib/crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");
export const BGM_DIR = path.join(DATA_DIR, "bgm");
export const VOICEOVER_DIR = path.join(DATA_DIR, "voiceover");
export const RENDER_DIR = path.join(DATA_DIR, "renders");

fs.mkdirSync(BGM_DIR, { recursive: true });
fs.mkdirSync(VOICEOVER_DIR, { recursive: true });
fs.mkdirSync(RENDER_DIR, { recursive: true });

function createClient() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  // Several worker processes can open this file concurrently during `next
  // build`'s page-data collection (no cross-process module cache) — without
  // a busy timeout, better-sqlite3 throws SQLITE_BUSY immediately instead of
  // waiting for a concurrent writer to finish.
  sqlite.pragma("busy_timeout = 15000");

  // Every CREATE/ALTER/bootstrap write below runs as one transaction instead
  // of many separate statements — each statement is its own lock negotiation,
  // so bundling them into a single BEGIN/COMMIT sharply cuts how often the 19
  // parallel `next build` workers contend for the write lock at all (fixes
  // recurring SQLITE_BUSY under the growing schema, 2026-07-16).
  const migrate = sqlite.transaction(() => {
    runMigrations(sqlite);
  });
  migrate();

  return drizzle(sqlite, { schema });
}

function runMigrations(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      script_text TEXT NOT NULL,
      scenes TEXT NOT NULL DEFAULT '[]',
      bgm TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      posted_url TEXT,
      posted_platform TEXT,
      posted_links TEXT NOT NULL DEFAULT '[]',
      completed_at INTEGER,
      generation_status TEXT NOT NULL DEFAULT 'idle',
      generation_error TEXT,
      previous_versions TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      reading_speed_bn INTEGER NOT NULL DEFAULT 120,
      reading_speed_en INTEGER NOT NULL DEFAULT 150
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  {
    const existingUserColumns = new Set(
      (sqlite.pragma("table_info(users)") as { name: string }[]).map((c) => c.name)
    );
    if (!existingUserColumns.has("is_admin")) {
      try {
        sqlite.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
      } catch (err) {
        if (!/duplicate column name/i.test((err as Error).message)) throw err;
      }
    }
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_api_keys (
      user_id TEXT PRIMARY KEY,
      gemini_key_enc TEXT,
      groq_key_enc TEXT,
      pexels_key_enc TEXT,
      pixabay_key_enc TEXT,
      telegram_bot_token_enc TEXT,
      telegram_chat_id_enc TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS script_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      script_text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS project_share_links (
      token TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gpu_type TEXT NOT NULL DEFAULT 'cpu',
      last_heartbeat_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Migrate DBs created before status/posted_url/posted_platform/posted_links/completed_at/
  // generation_status/generation_error/previous_versions/user_id existed. Several worker
  // processes can open this file concurrently during `next build`'s page-data collection (no
  // cross-process module cache), so a plain "column missing?" check can race — swallow
  // "duplicate column" from a concurrent migration instead of trying to serialize it.
  const existingColumns = new Set(
    (sqlite.pragma("table_info(projects)") as { name: string }[]).map((c) => c.name)
  );
  for (const [column, ddl] of [
    ["status", "ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'"],
    ["posted_url", "ALTER TABLE projects ADD COLUMN posted_url TEXT"],
    ["posted_platform", "ALTER TABLE projects ADD COLUMN posted_platform TEXT"],
    ["posted_links", "ALTER TABLE projects ADD COLUMN posted_links TEXT NOT NULL DEFAULT '[]'"],
    ["completed_at", "ALTER TABLE projects ADD COLUMN completed_at INTEGER"],
    ["generation_status", "ALTER TABLE projects ADD COLUMN generation_status TEXT NOT NULL DEFAULT 'idle'"],
    ["generation_error", "ALTER TABLE projects ADD COLUMN generation_error TEXT"],
    ["previous_versions", "ALTER TABLE projects ADD COLUMN previous_versions TEXT NOT NULL DEFAULT '[]'"],
    ["user_id", "ALTER TABLE projects ADD COLUMN user_id TEXT"],
    ["voiceover_path", "ALTER TABLE projects ADD COLUMN voiceover_path TEXT"],
    ["render_status", "ALTER TABLE projects ADD COLUMN render_status TEXT NOT NULL DEFAULT 'none'"],
    ["render_claimed_at", "ALTER TABLE projects ADD COLUMN render_claimed_at INTEGER"],
    ["render_error", "ALTER TABLE projects ADD COLUMN render_error TEXT"],
    ["final_video_path", "ALTER TABLE projects ADD COLUMN final_video_path TEXT"],
    ["assigned_agent_id", "ALTER TABLE projects ADD COLUMN assigned_agent_id TEXT"],
  ] as const) {
    if (existingColumns.has(column)) continue;
    try {
      sqlite.exec(ddl);
    } catch (err) {
      if (!/duplicate column name/i.test((err as Error).message)) throw err;
    }
  }

  bootstrapAdmin(sqlite);
}

// One-time migration for instances that had data before multi-user auth
// (2026-07-16): if no user exists yet and ADMIN_EMAIL/ADMIN_PASSWORD are
// set, create that user, hand them every orphaned project + the old global
// settings row, and seed their API keys from whatever was still in
// process.env — so the existing production deployment doesn't lose data or
// break on upgrade. No-ops on every boot after the first (users table is no
// longer empty).
function bootstrapAdmin(sqlite: Database.Database) {
  const userCount = (sqlite.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (userCount > 0) return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const now = Date.now();
  const adminId = randomUUID();

  sqlite
    .prepare("INSERT INTO users (id, email, password_hash, is_admin, created_at) VALUES (?, ?, ?, 1, ?)")
    .run(adminId, email, hashPassword(password), now);

  sqlite.prepare("UPDATE projects SET user_id = ? WHERE user_id IS NULL").run(adminId);

  const oldSettings = sqlite.prepare("SELECT * FROM settings WHERE id = 'global'").get() as
    | { reading_speed_bn: number; reading_speed_en: number }
    | undefined;
  sqlite
    .prepare(
      "INSERT INTO settings (id, reading_speed_bn, reading_speed_en) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING"
    )
    .run(adminId, oldSettings?.reading_speed_bn ?? 120, oldSettings?.reading_speed_en ?? 150);

  const envKeys: Record<string, string | undefined> = {
    gemini_key_enc: process.env.GEMINI_API_KEY,
    groq_key_enc: process.env.GROQ_API_KEY,
    pexels_key_enc: process.env.PEXELS_API_KEY,
    pixabay_key_enc: process.env.PIXABAY_API_KEY,
    telegram_bot_token_enc: process.env.TELEGRAM_BOT_TOKEN,
    telegram_chat_id_enc: process.env.TELEGRAM_CHAT_ID,
  };
  const columns = Object.keys(envKeys);
  const values = columns.map((c) => (envKeys[c] ? encryptSecret(envKeys[c]!) : null));
  sqlite
    .prepare(
      `INSERT INTO user_api_keys (user_id, ${columns.join(", ")}, updated_at) VALUES (?, ${columns.map(() => "?").join(", ")}, ?)`
    )
    .run(adminId, ...values, now);
}

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createClient> };

export const db = globalForDb.db ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
