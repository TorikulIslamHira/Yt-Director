import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");
export const BGM_DIR = path.join(DATA_DIR, "bgm");

fs.mkdirSync(BGM_DIR, { recursive: true });

function createClient() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
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
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Migrate DBs created before status/posted_url/posted_platform/posted_links/completed_at/
  // generation_status/generation_error existed. Several worker processes can open this
  // file concurrently during `next build`'s page-data collection (no cross-process module
  // cache), so a plain "column missing?" check can race — swallow "duplicate column" from
  // a concurrent migration instead of trying to serialize it.
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
  ] as const) {
    if (existingColumns.has(column)) continue;
    try {
      sqlite.exec(ddl);
    } catch (err) {
      if (!/duplicate column name/i.test((err as Error).message)) throw err;
    }
  }

  return drizzle(sqlite, { schema });
}

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createClient> };

export const db = globalForDb.db ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
