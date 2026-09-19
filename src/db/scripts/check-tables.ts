import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, client } from "../client";

const tables = await db.execute(
  sql`SELECT tablename FROM pg_tables WHERE schemaname = 'cofeed' ORDER BY tablename`,
);
console.log(
  "cofeed tables:",
  tables.map((r: any) => r.tablename),
);

const grants = await db.execute(
  sql`SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'cofeed' AND table_name = 'babies' LIMIT 10`,
);
console.log("babies grants:", grants);

const migrationsApplied = await db.execute(
  sql`SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`,
);
console.log("applied migrations:", migrationsApplied);

await client.end();
