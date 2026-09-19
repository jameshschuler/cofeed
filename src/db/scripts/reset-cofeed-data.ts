import "dotenv/config";

import { sql } from "drizzle-orm";
import { db, client } from "../client";

async function run() {
  await db.execute(
    sql.raw(`
    TRUNCATE TABLE
      cofeed.user_preferences,
      cofeed.feed_logs,
      cofeed.babies,
      cofeed.household_members,
      cofeed.households
    RESTART IDENTITY CASCADE
  `),
  );

  console.log("All cofeed data deleted.");
  await client.end();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
