import {
  pgSchema,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  real,
} from "drizzle-orm/pg-core";

export const cofeed = pgSchema("cofeed");
const auth = pgSchema("auth");

// Minimal auth.users projection for FK references.
export const authUsers = auth.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
});

export const roleEnum = cofeed.enum("role", ["owner", "caregiver", "viewer"]);
export const unitSystemEnum = cofeed.enum("unit_system", ["us_customary", "metric"]);
export const volumeUnitEnum = cofeed.enum("volume_unit", ["oz", "ml"]);

export const households = cofeed.table("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull(),
  joinCode: text("join_code").notNull().unique(),
  weekStartsMonday: boolean("week_starts_monday").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const householdMembers = cofeed.table("household_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull().default("caregiver"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const babies = cofeed.table("babies", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  unitSystem: unitSystemEnum("unit_system").notNull().default("us_customary"),
  defaultGrowthRateOzPerWeek: real("default_growth_rate_oz_per_week")
    .notNull()
    .default(6),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedLogs = cofeed.table("feed_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .notNull()
    .references(() => babies.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  formulaPortionVolume: real("formula_portion_volume"),
  formulaPortionUnit: volumeUnitEnum("formula_portion_unit"),
  breastMilkPortionVolume: real("breast_milk_portion_volume"),
  breastMilkPortionUnit: volumeUnitEnum("breast_milk_portion_unit"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  serverReceivedAt: timestamp("server_received_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userPreferences = cofeed.table("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  profileName: text("profile_name"),
  displayVolumeUnit: volumeUnitEnum("display_volume_unit").notNull().default("oz"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
