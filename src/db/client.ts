import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Use Supabase's session pooler (port 5432): the transaction pooler (6543) drops or hangs
// multi-statement transactions. Prepared statements stay off so either pooler works for reads.
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
