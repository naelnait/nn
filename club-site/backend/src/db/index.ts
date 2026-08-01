import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { runMigrations } from "./migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, "..", "..", "data", "ccmb.sqlite");

let db: Database.Database | undefined;

/** Opens (once) the sqlite file, running any pending migrations first. */
export function getDb(): Database.Database {
  if (db) return db;
  mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  return db;
}
