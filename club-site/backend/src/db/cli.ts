import { getDb } from "./index.js";
import { rollbackLastMigration } from "./migrate.js";
import { seedDatabase } from "./seed.js";

// `getDb()` already runs pending migrations on open, so `db:migrate` and the
// server's own startup both converge on the same up-to-date schema.
const cmd = process.argv[2];

if (cmd === "migrate") {
  getDb();
  console.log("[db] migrations up to date");
} else if (cmd === "seed") {
  const db = getDb();
  seedDatabase(db);
  console.log("[db] seeded from src/data/*.json");
} else if (cmd === "rollback") {
  const db = getDb();
  rollbackLastMigration(db);
} else {
  console.error("Usage: tsx src/db/cli.ts <migrate|seed|rollback>");
  process.exit(1);
}
