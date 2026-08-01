import { createApp } from "./app.js";
import { getDb } from "./db/index.js";
import { seedDatabase } from "./db/seed.js";

const port = Number(process.env.PORT) || 4000;

// getDb() applies pending migrations on open. Seeding only runs against an
// empty database (first boot / fresh clone) — production deployments that
// want to re-sync content from src/data/*.json run `npm run db:seed`
// explicitly instead, so a running instance never has its data silently
// overwritten on restart.
const db = getDb();
const playerCount = (db.prepare("SELECT COUNT(*) AS n FROM players").get() as { n: number }).n;
if (playerCount === 0) {
  seedDatabase(db);
  console.log("[db] empty database seeded from src/data/*.json");
}

const app = createApp();

app.listen(port, () => {
  console.log(`CCMB API listening on http://localhost:${port}`);
});
