import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ override: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
