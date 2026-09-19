import "dotenv/config";

import { sql } from "drizzle-orm";
import { db } from "../client";

async function run() {
  await db.execute(
    sql.raw(
      `alter role authenticator set pgrst.db_schemas = 'public,storage,graphql_public,cofeed'`,
    ),
  );

  await db.execute(sql.raw(`notify pgrst, 'reload config'`));

  console.log("PostgREST config updated: cofeed schema is now exposed. Reloading…");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
