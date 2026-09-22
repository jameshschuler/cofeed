import "dotenv/config";

import { sql } from "drizzle-orm";
import { db } from "../client";

const tables = [
  "households",
  "household_members",
  "babies",
  "feed_logs",
  "pumping_logs",
  "user_preferences",
];

async function run() {
  // Grant schema usage to PostgREST roles
  await db.execute(
    sql.raw(`GRANT USAGE ON SCHEMA cofeed TO anon, authenticated, service_role`),
  );

  for (const table of tables) {
    await db.execute(
      sql.raw(
        `GRANT SELECT, INSERT, UPDATE, DELETE ON cofeed.${table} TO anon, authenticated, service_role`,
      ),
    );
  }

  // Keep RLS disabled until table policies are implemented.
  for (const table of tables) {
    await db.execute(sql.raw(`ALTER TABLE cofeed.${table} DISABLE ROW LEVEL SECURITY`));
  }

  // Reload PostgREST config
  await db.execute(sql.raw(`NOTIFY pgrst, 'reload schema'`));

  console.log("Grants applied and PostgREST schema reloaded.");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
