CREATE SCHEMA "cofeed";
--> statement-breakpoint
CREATE TYPE "cofeed"."role" AS ENUM('owner', 'caregiver', 'viewer');--> statement-breakpoint
CREATE TYPE "cofeed"."unit_system" AS ENUM('us_customary', 'metric');--> statement-breakpoint
CREATE TYPE "cofeed"."volume_unit" AS ENUM('oz', 'ml');--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "cofeed"."feed_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"formula_portion_volume" real,
	"formula_portion_unit" "cofeed"."volume_unit",
	"breast_milk_portion_volume" real,
	"breast_milk_portion_unit" "cofeed"."volume_unit",
	"source" text DEFAULT 'cofeed' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"server_received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_logs_baby_idempotency_key_unique" UNIQUE("baby_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "cofeed"."household_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "cofeed"."role" DEFAULT 'caregiver' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cofeed"."households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"timezone" text NOT NULL,
	"join_code" text NOT NULL,
	"week_starts_monday" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "households_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "cofeed"."pumping_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"volume" real NOT NULL,
	"unit" "cofeed"."volume_unit" NOT NULL,
	"source" text DEFAULT 'cofeed' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pumping_logs_baby_idempotency_key_unique" UNIQUE("baby_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "cofeed"."user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"profile_name" text,
	"display_volume_unit" "cofeed"."volume_unit" DEFAULT 'oz' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cofeed"."babies" ADD CONSTRAINT "babies_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "cofeed"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cofeed"."feed_logs" ADD CONSTRAINT "feed_logs_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "cofeed"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cofeed"."feed_logs" ADD CONSTRAINT "feed_logs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cofeed"."household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "cofeed"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cofeed"."household_members" ADD CONSTRAINT "household_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cofeed"."pumping_logs" ADD CONSTRAINT "pumping_logs_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "cofeed"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cofeed"."pumping_logs" ADD CONSTRAINT "pumping_logs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cofeed"."user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_household_user_unique" ON "cofeed"."household_members" USING btree ("household_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_one_owner_per_user" ON "cofeed"."household_members" USING btree ("user_id") WHERE "cofeed"."household_members"."role" = 'owner';--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_one_default_per_user" ON "cofeed"."household_members" USING btree ("user_id") WHERE "cofeed"."household_members"."is_default";

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- Everything below is hand-written: drizzle-kit does not model grants, RLS or
-- triggers. Keep it in sync with src/db/schema.ts when tables change.
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA "cofeed" TO anon, authenticated, service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "cofeed" TO anon, authenticated, service_role;--> statement-breakpoint

CREATE FUNCTION cofeed.is_household_member(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cofeed, auth, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cofeed.household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = auth.uid()
  );
$$;--> statement-breakpoint

CREATE FUNCTION cofeed.is_household_owner(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cofeed, auth, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cofeed.household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'owner'
  );
$$;--> statement-breakpoint

CREATE FUNCTION cofeed.can_write_household(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cofeed, auth, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cofeed.household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'caregiver')
  );
$$;--> statement-breakpoint

CREATE FUNCTION cofeed.is_empty_household(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cofeed, auth, public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM cofeed.household_members hm
    WHERE hm.household_id = p_household_id
  );
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION cofeed.is_household_member(uuid) FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON FUNCTION cofeed.is_household_owner(uuid) FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON FUNCTION cofeed.can_write_household(uuid) FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON FUNCTION cofeed.is_empty_household(uuid) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION cofeed.is_household_member(uuid) TO anon, authenticated, service_role;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION cofeed.is_household_owner(uuid) TO anon, authenticated, service_role;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION cofeed.can_write_household(uuid) TO anon, authenticated, service_role;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION cofeed.is_empty_household(uuid) TO anon, authenticated, service_role;--> statement-breakpoint

ALTER TABLE cofeed.households ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE cofeed.household_members ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE cofeed.babies ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE cofeed.feed_logs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE cofeed.pumping_logs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE cofeed.user_preferences ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY households_member_select ON cofeed.households
FOR SELECT TO authenticated
USING (cofeed.is_household_member(id));--> statement-breakpoint

CREATE POLICY households_owner_insert ON cofeed.households
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);--> statement-breakpoint

CREATE POLICY households_owner_update ON cofeed.households
FOR UPDATE TO authenticated
USING (cofeed.is_household_owner(id))
WITH CHECK (cofeed.is_household_owner(id));--> statement-breakpoint

CREATE POLICY household_members_member_select ON cofeed.household_members
FOR SELECT TO authenticated
USING (cofeed.is_household_member(household_id));--> statement-breakpoint

CREATE POLICY household_members_self_insert ON cofeed.household_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    (role = 'owner' AND cofeed.is_empty_household(household_id))
    OR (role = 'caregiver' AND cofeed.is_household_member(household_id))
  )
);--> statement-breakpoint

CREATE POLICY household_members_owner_update ON cofeed.household_members
FOR UPDATE TO authenticated
USING (cofeed.is_household_owner(household_id))
WITH CHECK (cofeed.is_household_owner(household_id));--> statement-breakpoint

CREATE POLICY household_members_owner_delete ON cofeed.household_members
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR (cofeed.is_household_owner(household_id) AND user_id <> auth.uid())
);--> statement-breakpoint

CREATE POLICY babies_member_select ON cofeed.babies
FOR SELECT TO authenticated
USING (cofeed.is_household_member(household_id));--> statement-breakpoint

CREATE POLICY babies_member_write ON cofeed.babies
FOR INSERT TO authenticated
WITH CHECK (cofeed.can_write_household(household_id));--> statement-breakpoint

CREATE POLICY babies_member_update ON cofeed.babies
FOR UPDATE TO authenticated
USING (cofeed.can_write_household(household_id))
WITH CHECK (cofeed.can_write_household(household_id));--> statement-breakpoint

CREATE POLICY babies_member_delete ON cofeed.babies
FOR DELETE TO authenticated
USING (cofeed.is_household_owner(household_id));--> statement-breakpoint

CREATE POLICY feed_logs_member_select ON cofeed.feed_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.is_household_member(b.household_id)
  )
);--> statement-breakpoint

CREATE POLICY feed_logs_member_insert ON cofeed.feed_logs
FOR INSERT TO authenticated
WITH CHECK (
  created_by_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)
  )
);--> statement-breakpoint

CREATE POLICY feed_logs_member_update ON cofeed.feed_logs
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)
  )
);--> statement-breakpoint

CREATE POLICY feed_logs_member_delete ON cofeed.feed_logs
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)
  )
);--> statement-breakpoint

CREATE POLICY pumping_logs_member_select ON cofeed.pumping_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.is_household_member(b.household_id)
  )
);--> statement-breakpoint

CREATE POLICY pumping_logs_member_insert ON cofeed.pumping_logs
FOR INSERT TO authenticated
WITH CHECK (
  created_by_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)
  )
);--> statement-breakpoint

CREATE POLICY user_preferences_self_select ON cofeed.user_preferences
FOR SELECT TO authenticated
USING (user_id = auth.uid());--> statement-breakpoint

CREATE POLICY user_preferences_self_insert ON cofeed.user_preferences
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());--> statement-breakpoint

CREATE POLICY user_preferences_self_update ON cofeed.user_preferences
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());--> statement-breakpoint

-- Create a user's default household, owner membership and baby when they sign up
-- through CoFeed. The Supabase project's auth is shared with other apps, so only
-- signups tagged with app = 'cofeed' in their metadata are handled here.
-- getProfile still creates the household on demand as a fallback.
CREATE FUNCTION cofeed.create_default_household_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cofeed, public
AS $$
DECLARE
  requested_timezone text := NEW.raw_user_meta_data ->> 'timezone';
  household_timezone text := 'UTC';
  new_household_id uuid;
  new_join_code text;
BEGIN
  IF coalesce(NEW.raw_user_meta_data ->> 'app', '') <> 'cofeed' THEN
    RETURN NEW;
  END IF;

  IF requested_timezone IS NOT NULL
    AND EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = requested_timezone) THEN
    household_timezone := requested_timezone;
  END IF;

  BEGIN
    LOOP
      new_join_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM cofeed.households WHERE join_code = new_join_code
      );
    END LOOP;

    INSERT INTO cofeed.households (name, timezone, join_code)
    VALUES ('My Household', household_timezone, new_join_code)
    RETURNING id INTO new_household_id;

    INSERT INTO cofeed.household_members (household_id, user_id, role, is_default)
    VALUES (new_household_id, NEW.id, 'owner', true);

    INSERT INTO cofeed.babies (household_id, name, date_of_birth)
    VALUES (
      new_household_id,
      'Baby',
      (now() AT TIME ZONE household_timezone)::date
    );
  EXCEPTION WHEN OTHERS THEN
    -- Never block account creation; getProfile creates the household on first load.
    RAISE WARNING 'create_default_household_for_user failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created_create_default_household ON auth.users;--> statement-breakpoint
CREATE TRIGGER on_auth_user_created_create_default_household
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION cofeed.create_default_household_for_user();
