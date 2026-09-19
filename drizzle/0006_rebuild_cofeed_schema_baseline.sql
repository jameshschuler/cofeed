DROP SCHEMA IF EXISTS "cofeed" CASCADE;

CREATE SCHEMA "cofeed";

CREATE TYPE "cofeed"."role" AS ENUM('owner', 'caregiver', 'viewer');
CREATE TYPE "cofeed"."unit_system" AS ENUM('us_customary', 'metric');
CREATE TYPE "cofeed"."volume_unit" AS ENUM('oz', 'ml');

CREATE TABLE "cofeed"."households" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "timezone" text NOT NULL,
  "week_starts_monday" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cofeed"."household_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" "cofeed"."role" DEFAULT 'caregiver' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cofeed"."babies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL,
  "name" text NOT NULL,
  "date_of_birth" date NOT NULL,
  "unit_system" "cofeed"."unit_system" DEFAULT 'us_customary' NOT NULL,
  "default_growth_rate_oz_per_week" real DEFAULT 6 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cofeed"."weight_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "baby_id" uuid NOT NULL,
  "measured_at" timestamp with time zone NOT NULL,
  "pounds" integer,
  "ounces" real,
  "grams" real,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cofeed"."daily_intake_goals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "baby_id" uuid NOT NULL,
  "date" date NOT NULL,
  "calculated_from_weight_entry_id" uuid NOT NULL,
  "growth_rate_oz_per_week" real NOT NULL,
  "goal_volume_oz" real NOT NULL,
  "goal_volume_ml" real NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "daily_intake_goals_baby_date_unique" UNIQUE("baby_id", "date")
);

CREATE TABLE "cofeed"."feed_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "baby_id" uuid NOT NULL,
  "started_at" timestamp with time zone NOT NULL,
  "ended_at" timestamp with time zone,
  "formula_portion_volume" real,
  "formula_portion_unit" "cofeed"."volume_unit",
  "breast_milk_portion_volume" real,
  "breast_milk_portion_unit" "cofeed"."volume_unit",
  "vitamin_d_given" boolean DEFAULT false NOT NULL,
  "spit_up" boolean DEFAULT false NOT NULL,
  "notes" text,
  "idempotency_key" text NOT NULL,
  "created_by_user_id" uuid NOT NULL,
  "server_received_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "feed_logs_idempotency_key_unique" UNIQUE("idempotency_key")
);

CREATE TABLE "cofeed"."diaper_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "baby_id" uuid NOT NULL,
  "feed_log_id" uuid NOT NULL,
  "timestamp" timestamp with time zone NOT NULL,
  "wet" boolean DEFAULT false NOT NULL,
  "poopy" boolean DEFAULT false NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "diaper_logs_feed_log_id_unique" UNIQUE("feed_log_id")
);

CREATE TABLE "cofeed"."user_preferences" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "display_volume_unit" "cofeed"."volume_unit" DEFAULT 'oz' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "cofeed"."household_members"
ADD CONSTRAINT "household_members_household_id_households_id_fk"
FOREIGN KEY ("household_id") REFERENCES "cofeed"."households"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cofeed"."household_members"
ADD CONSTRAINT "household_members_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cofeed"."babies"
ADD CONSTRAINT "babies_household_id_households_id_fk"
FOREIGN KEY ("household_id") REFERENCES "cofeed"."households"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cofeed"."weight_entries"
ADD CONSTRAINT "weight_entries_baby_id_babies_id_fk"
FOREIGN KEY ("baby_id") REFERENCES "cofeed"."babies"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cofeed"."daily_intake_goals"
ADD CONSTRAINT "daily_intake_goals_baby_id_babies_id_fk"
FOREIGN KEY ("baby_id") REFERENCES "cofeed"."babies"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cofeed"."daily_intake_goals"
ADD CONSTRAINT "daily_intake_goals_calculated_from_weight_entry_id_weight_entries_id_fk"
FOREIGN KEY ("calculated_from_weight_entry_id") REFERENCES "cofeed"."weight_entries"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "cofeed"."feed_logs"
ADD CONSTRAINT "feed_logs_baby_id_babies_id_fk"
FOREIGN KEY ("baby_id") REFERENCES "cofeed"."babies"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cofeed"."feed_logs"
ADD CONSTRAINT "feed_logs_created_by_user_id_users_id_fk"
FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cofeed"."diaper_logs"
ADD CONSTRAINT "diaper_logs_baby_id_babies_id_fk"
FOREIGN KEY ("baby_id") REFERENCES "cofeed"."babies"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cofeed"."diaper_logs"
ADD CONSTRAINT "diaper_logs_feed_log_id_feed_logs_id_fk"
FOREIGN KEY ("feed_log_id") REFERENCES "cofeed"."feed_logs"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cofeed"."user_preferences"
ADD CONSTRAINT "user_preferences_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

GRANT USAGE ON SCHEMA "cofeed" TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "cofeed" TO anon, authenticated, service_role;

ALTER TABLE "cofeed"."user_preferences" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_self_select" ON "cofeed"."user_preferences"
FOR SELECT
USING ("user_id" = auth.uid());

CREATE POLICY "user_preferences_self_insert" ON "cofeed"."user_preferences"
FOR INSERT
WITH CHECK ("user_id" = auth.uid());

CREATE POLICY "user_preferences_self_update" ON "cofeed"."user_preferences"
FOR UPDATE
USING ("user_id" = auth.uid())
WITH CHECK ("user_id" = auth.uid());
