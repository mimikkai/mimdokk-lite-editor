import { Database } from "bun:sqlite";

const DB_PATH = process.env.DB_PATH ?? "./mimdokk.db";

let _db: Database | null = null;

export function initDB(): Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.run("PRAGMA journal_mode = WAL;");
  _db.run(`
    CREATE TABLE IF NOT EXISTS templates (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      data       TEXT NOT NULL,
      tags       TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  console.info(`[db] initialized — path: ${DB_PATH}`);
  return _db;
}

export const db = initDB();
