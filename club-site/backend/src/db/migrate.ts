import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");

function upMigrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql"))
    .sort();
}

/** Applies every migration not yet recorded in `_migrations`, each in its own transaction. */
export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const applied = new Set(
    db.prepare("SELECT name FROM _migrations").all().map((r) => (r as { name: string }).name)
  );

  for (const file of upMigrationFiles()) {
    if (applied.has(file)) continue;
    const sql = readFileSync(path.join(migrationsDir, file), "utf-8");
    const apply = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
    });
    apply();
    console.log(`[migrate] applied ${file}`);
  }
}

/** Reverts the single most-recently-applied migration using its `.down.sql` sibling. */
export function rollbackLastMigration(db: Database.Database): void {
  const last = db
    .prepare("SELECT name FROM _migrations ORDER BY id DESC LIMIT 1")
    .get() as { name: string } | undefined;
  if (!last) {
    console.log("[migrate] nothing to roll back");
    return;
  }
  const downFile = last.name.replace(/\.sql$/, ".down.sql");
  const downPath = path.join(migrationsDir, downFile);
  const sql = readFileSync(downPath, "utf-8");
  const revert = db.transaction(() => {
    db.exec(sql);
    db.prepare("DELETE FROM _migrations WHERE name = ?").run(last.name);
  });
  revert();
  console.log(`[migrate] rolled back ${last.name} (via ${downFile})`);
}
