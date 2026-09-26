import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db, client } from "../client";

type MigrationJournal = {
  entries: Array<{ tag: string; when: number }>;
};

const journal = JSON.parse(
  readFileSync("drizzle/meta/_journal.json", "utf8"),
) as MigrationJournal;

const migrations = journal.entries.map((entry) => {
  const contents = readFileSync(`drizzle/${entry.tag}.sql`, "utf8");
  return {
    hash: createHash("sha256").update(contents).digest("hex"),
    createdAt: entry.when,
  };
});

await db.execute(sql.raw('CREATE SCHEMA IF NOT EXISTS "cofeed_migrations"'));
await db.execute(
  sql.raw(`
  CREATE TABLE IF NOT EXISTS "cofeed_migrations"."__drizzle_migrations" (
    id serial PRIMARY KEY NOT NULL,
    hash text NOT NULL,
    created_at bigint NOT NULL
  )
`),
);

const existing = await db.execute<{ created_at: string }>(
  sql.raw(`
  SELECT created_at
  FROM "cofeed_migrations"."__drizzle_migrations"
  ORDER BY created_at DESC
  LIMIT 1
`),
);

if (existing.length === 0) {
  for (const migration of migrations) {
    await db.execute(sql`
      INSERT INTO "cofeed_migrations"."__drizzle_migrations" (hash, created_at)
      VALUES (${migration.hash}, ${migration.createdAt})
    `);
  }
  console.log(`Bootstrapped ${migrations.length} CoFeed migrations.`);
} else {
  const latestExpected = migrations.at(-1)?.createdAt;
  if (Number(existing[0].created_at) !== latestExpected) {
    throw new Error(
      "CoFeed migration journal does not match the local migration history.",
    );
  }
  console.log("CoFeed migration journal is already initialized.");
}

await client.end();
