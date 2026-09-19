DROP TABLE IF EXISTS "cofeed"."diaper_logs" CASCADE;
DROP TABLE IF EXISTS "cofeed"."daily_intake_goals" CASCADE;
DROP TABLE IF EXISTS "cofeed"."weight_entries" CASCADE;

ALTER TABLE "cofeed"."feed_logs"
  DROP COLUMN IF EXISTS "ended_at",
  DROP COLUMN IF EXISTS "vitamin_d_given",
  DROP COLUMN IF EXISTS "spit_up",
  DROP COLUMN IF EXISTS "notes";