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
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  return drizzle(sqlite, { schema });
}

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createClient> };

export const db = globalForDb.db ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
