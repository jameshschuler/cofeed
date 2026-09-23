import "dotenv/config";

import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, client } from "../client";
import {
  authUsers,
  babies,
  feedLogs,
  householdMembers,
  households,
  pumpingLogs,
  userPreferences,
} from "../schema";

const DEFAULT_SEED_EMAIL = "jameshschuler1+cofeed@gmail.com";
const USER_JOIN_CODE = "JAMES1";
const SHARED_JOIN_CODE = "SHR456";
const SHARED_HOUSEHOLD_NAME = "CoFeed Shared Test Household";
const SHARED_USER_EMAILS = [
  "jameshschuler1+cofeed@gmail.com",
  "jameshschuler1+test1@gmail.com",
];
const TEST_JOIN_CODE = "TEST42";

async function resolveUserIdByEmail(email: string) {
  const [user] = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, email))
    .limit(1);

  if (!user?.id) {
    throw new Error(`No auth.users row found for email: ${email}`);
  }

  return user.id;
}

// Idempotent single-user household + baby + sample feeds (default seed).
async function seedUserHousehold() {
  const seedEmail = process.env.SEED_USER_EMAIL ?? DEFAULT_SEED_EMAIL;
  const userId = await resolveUserIdByEmail(seedEmail);

  let householdId: string;
  const [existingMembership] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .limit(1);

  if (existingMembership?.householdId) {
    householdId = existingMembership.householdId;
  } else {
    const [household] = await db
      .insert(households)
      .values({
        name: "CoFeed Household",
        timezone: "America/New_York",
        joinCode: USER_JOIN_CODE,
      })
      .returning({ id: households.id });

    householdId = household.id;

    await db.insert(householdMembers).values({
      householdId,
      userId,
      role: "owner",
    });
  }

  const coParentId = await resolveUserIdByEmail(SHARED_USER_EMAILS[1]);
  const [coParentMembership] = await db
    .select({ id: householdMembers.id })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.householdId, householdId),
        eq(householdMembers.userId, coParentId),
      ),
    )
    .limit(1);

  if (!coParentMembership) {
    await db.insert(householdMembers).values({
      householdId,
      userId: coParentId,
      role: "caregiver",
    });
  }

  await db
    .insert(userPreferences)
    .values({
      userId: coParentId,
      profileName: "Co-parent",
      displayVolumeUnit: "ml",
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { profileName: "Co-parent", displayVolumeUnit: "ml", updatedAt: new Date() },
    });

  let babyId: string;
  const [existingBaby] = await db
    .select({ id: babies.id })
    .from(babies)
    .where(eq(babies.householdId, householdId))
    .limit(1);

  if (existingBaby?.id) {
    babyId = existingBaby.id;
  } else {
    const [baby] = await db
      .insert(babies)
      .values({
        householdId,
        name: "CoFeed Baby",
        dateOfBirth: "2026-06-01",
        unitSystem: "us_customary",
        defaultGrowthRateOzPerWeek: 6,
      })
      .returning({ id: babies.id });

    babyId = baby.id;
  }

  // Re-seed feeds fresh on every run so reruns always produce visible data.
  await db.delete(feedLogs).where(eq(feedLogs.babyId, babyId));
  await db.delete(pumpingLogs).where(eq(pumpingLogs.babyId, babyId));

  const now = new Date();
  const dailyTemplateFeeds = [
    { hoursAgo: 21, formulaMl: 75, breastMilkMl: 0 },
    { hoursAgo: 18, formulaMl: 45, breastMilkMl: 45 },
    { hoursAgo: 15, formulaMl: 0, breastMilkMl: 85 },
    { hoursAgo: 9, formulaMl: 95, breastMilkMl: 0 },
    { hoursAgo: 6, formulaMl: 45, breastMilkMl: 45 },
    { hoursAgo: 3, formulaMl: 0, breastMilkMl: 85 },
    { hoursAgo: 1, formulaMl: 95, breastMilkMl: 0 },
  ];
  const DAYS_OF_HISTORY = 4;

  for (let dayOffset = DAYS_OF_HISTORY - 1; dayOffset >= 0; dayOffset -= 1) {
    for (const item of dailyTemplateFeeds) {
      const startedAt = new Date(
        now.getTime() - (dayOffset * 24 + item.hoursAgo) * 60 * 60 * 1000,
      );
      await db.insert(feedLogs).values({
        babyId,
        startedAt,
        formulaPortionVolume: item.formulaMl || null,
        formulaPortionUnit: item.formulaMl ? "ml" : null,
        breastMilkPortionVolume: item.breastMilkMl || null,
        breastMilkPortionUnit: item.breastMilkMl ? "ml" : null,
        idempotencyKey: randomUUID(),
        createdByUserId: userId,
      });
    }

    await db.insert(pumpingLogs).values({
      babyId,
      startedAt: new Date(now.getTime() - (dayOffset * 24 + 12) * 60 * 60 * 1000),
      volume: 120 + dayOffset * 15,
      unit: "ml",
      idempotencyKey: randomUUID(),
      createdByUserId: userId,
    });
  }

  await db
    .insert(userPreferences)
    .values({
      userId,
      profileName: seedEmail.split("@")[0],
      displayVolumeUnit: "ml",
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { displayVolumeUnit: "ml", updatedAt: new Date() },
    });

  console.log("Seed complete", { seedEmail, userId, householdId, babyId });
}

// Idempotent multi-user shared household with several days of feed history.
async function seedSharedHousehold() {
  const userIds = await Promise.all(SHARED_USER_EMAILS.map(resolveUserIdByEmail));

  let [household] = await db
    .select({ id: households.id })
    .from(households)
    .where(eq(households.joinCode, SHARED_JOIN_CODE))
    .limit(1);

  if (!household) {
    [household] = await db
      .insert(households)
      .values({
        name: SHARED_HOUSEHOLD_NAME,
        timezone: "America/New_York",
        joinCode: SHARED_JOIN_CODE,
      })
      .returning({ id: households.id });
  }

  const existingOwnerFlags = await Promise.all(
    userIds.map(async (userId) => {
      const [ownerMembership] = await db
        .select({ id: householdMembers.id })
        .from(householdMembers)
        .where(
          and(eq(householdMembers.userId, userId), eq(householdMembers.role, "owner")),
        )
        .limit(1);
      return Boolean(ownerMembership);
    }),
  );
  const ownerIndex = existingOwnerFlags.findIndex((hasOwner) => !hasOwner);
  if (ownerIndex < 0) {
    throw new Error("No shared seed user is available to own the household.");
  }

  for (const [index, userId] of userIds.entries()) {
    const [membership] = await db
      .select({ id: householdMembers.id })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, household.id),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!membership) {
      await db.insert(householdMembers).values({
        householdId: household.id,
        userId,
        role: index === ownerIndex ? "owner" : "caregiver",
      });
    } else {
      await db
        .update(householdMembers)
        .set({ role: index === ownerIndex ? "owner" : "caregiver" })
        .where(eq(householdMembers.id, membership.id));
    }

    await db
      .insert(userPreferences)
      .values({
        userId,
        profileName: index === 0 ? "James" : "Co-parent",
        displayVolumeUnit: "ml",
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          profileName: index === 0 ? "James" : "Co-parent",
          displayVolumeUnit: "ml",
          updatedAt: new Date(),
        },
      });
  }

  let [baby] = await db
    .select({ id: babies.id })
    .from(babies)
    .where(eq(babies.householdId, household.id))
    .limit(1);

  if (!baby) {
    [baby] = await db
      .insert(babies)
      .values({
        householdId: household.id,
        name: "Shared Test Baby",
        dateOfBirth: "2026-06-01",
        unitSystem: "metric",
        defaultGrowthRateOzPerWeek: 6,
      })
      .returning({ id: babies.id });
  }

  const volumes = [160, 180, 150, 195, 170, 185];
  const now = new Date();
  let createdFeeds = 0;

  for (let dayOffset = 2; dayOffset >= 0; dayOffset -= 1) {
    for (let feedIndex = 0; feedIndex < volumes.length; feedIndex += 1) {
      const startedAt = new Date(now);
      startedAt.setDate(now.getDate() - dayOffset);
      startedAt.setHours(feedIndex * 4, 0, 0, 0);

      const totalMl = volumes[feedIndex];
      const formulaMl = feedIndex % 2 === 0 ? Math.round(totalMl * 0.6) : 0;
      const breastMilkMl = totalMl - formulaMl;
      const loggerId = userIds[(dayOffset + feedIndex) % userIds.length];
      const idempotencyKey = `shared-test-${startedAt.toISOString()}`;

      const [existing] = await db
        .select({ id: feedLogs.id })
        .from(feedLogs)
        .where(eq(feedLogs.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existing) continue;

      await db.insert(feedLogs).values({
        babyId: baby.id,
        startedAt,
        formulaPortionVolume: formulaMl || null,
        formulaPortionUnit: formulaMl ? "ml" : null,
        breastMilkPortionVolume: breastMilkMl || null,
        breastMilkPortionUnit: breastMilkMl ? "ml" : null,
        idempotencyKey,
        createdByUserId: loggerId,
      });
      createdFeeds += 1;
    }
  }

  console.log("Shared household seeded", {
    householdId: household.id,
    babyId: baby.id,
    joinCode: SHARED_JOIN_CODE,
    users: SHARED_USER_EMAILS,
    createdFeeds,
  });
}

// Ensures join-code RPC functions/schema exist, then seeds a household to join via code.
async function ensureJoinSchema() {
  await db.execute(
    sql.raw(`
    ALTER TABLE cofeed.households ADD COLUMN IF NOT EXISTS join_code text;
    UPDATE cofeed.households
    SET join_code = upper(substr(md5(random()::text || id::text), 1, 6))
    WHERE join_code IS NULL;
    ALTER TABLE cofeed.households ALTER COLUMN join_code SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS households_join_code_unique
      ON cofeed.households (join_code);
    CREATE OR REPLACE FUNCTION cofeed.join_household_by_code(p_join_code text)
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = cofeed, public
    AS $function$
    DECLARE matched_household_id uuid;
    BEGIN
      SELECT id INTO matched_household_id
      FROM cofeed.households
      WHERE join_code = upper(trim(p_join_code));
      IF matched_household_id IS NULL THEN
        RAISE EXCEPTION 'Household code not found';
      END IF;
      INSERT INTO cofeed.household_members (household_id, user_id, role)
      VALUES (matched_household_id, auth.uid(), 'caregiver')
      ON CONFLICT DO NOTHING;
      RETURN matched_household_id;
    END;
    $function$;
    REVOKE ALL ON FUNCTION cofeed.join_household_by_code(text) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION cofeed.join_household_by_code(text) TO authenticated;
    CREATE OR REPLACE FUNCTION cofeed.list_my_households()
    RETURNS TABLE (
      household_id uuid,
      household_name text,
      join_code text,
      member_role cofeed.role
    )
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = cofeed, public
    AS $function$
      SELECT h.id, h.name, h.join_code, hm.role
      FROM cofeed.household_members hm
      JOIN cofeed.households h ON h.id = hm.household_id
      WHERE hm.user_id = auth.uid()
      ORDER BY h.name;
    $function$;
    CREATE OR REPLACE FUNCTION cofeed.leave_household(p_household_id uuid)
    RETURNS void
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = cofeed, public
    AS $function$
      DELETE FROM cofeed.household_members
      WHERE household_id = p_household_id AND user_id = auth.uid();
    $function$;
    REVOKE ALL ON FUNCTION cofeed.list_my_households() FROM PUBLIC;
    REVOKE ALL ON FUNCTION cofeed.leave_household(uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION cofeed.list_my_households() TO authenticated;
    GRANT EXECUTE ON FUNCTION cofeed.leave_household(uuid) TO authenticated;
    CREATE OR REPLACE FUNCTION cofeed.list_feed_logs(
      p_baby_id uuid,
      p_since timestamptz DEFAULT NULL
    )
    RETURNS TABLE (
      id uuid,
      started_at timestamptz,
      formula_portion_volume real,
      formula_portion_unit cofeed.volume_unit,
      breast_milk_portion_volume real,
      breast_milk_portion_unit cofeed.volume_unit,
      household_name text,
      logger_email text
    )
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = cofeed, auth, public
    AS $function$
      SELECT fl.id, fl.started_at, fl.formula_portion_volume,
        fl.formula_portion_unit, fl.breast_milk_portion_volume,
        fl.breast_milk_portion_unit, h.name, u.email
      FROM cofeed.feed_logs fl
      JOIN cofeed.babies b ON b.id = fl.baby_id
      JOIN cofeed.households h ON h.id = b.household_id
      JOIN cofeed.household_members hm
        ON hm.household_id = h.id AND hm.user_id = auth.uid()
      LEFT JOIN auth.users u ON u.id = fl.created_by_user_id
      WHERE fl.baby_id = p_baby_id
        AND (p_since IS NULL OR fl.started_at >= p_since)
      ORDER BY fl.started_at DESC
      LIMIT 50;
    $function$;
    REVOKE ALL ON FUNCTION cofeed.list_feed_logs(uuid, timestamptz) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION cofeed.list_feed_logs(uuid, timestamptz) TO authenticated;
    ALTER ROLE authenticator SET pgrst.db_schemas = 'public,storage,graphql_public,cofeed';
    NOTIFY pgrst, 'reload config';
    NOTIFY pgrst, 'reload schema';
  `),
  );
}

async function seedTestHousehold() {
  await ensureJoinSchema();

  const [existingHousehold] = await db
    .select({ id: households.id })
    .from(households)
    .where(eq(households.joinCode, TEST_JOIN_CODE))
    .limit(1);

  if (existingHousehold?.id) {
    console.log("Test household already exists", {
      householdId: existingHousehold.id,
      joinCode: TEST_JOIN_CODE,
    });
    return;
  }

  const [household] = await db
    .insert(households)
    .values({
      name: "CoFeed Test Household",
      timezone: "America/New_York",
      joinCode: TEST_JOIN_CODE,
    })
    .returning({ id: households.id });

  const [baby] = await db
    .insert(babies)
    .values({
      householdId: household.id,
      name: "Test Baby",
      dateOfBirth: "2026-06-01",
      unitSystem: "us_customary",
      defaultGrowthRateOzPerWeek: 6,
    })
    .returning({ id: babies.id });

  console.log("Test household seeded", {
    householdId: household.id,
    babyId: baby.id,
    joinCode: TEST_JOIN_CODE,
  });
}

async function run() {
  const mode = process.env.SEED_MODE ?? "user";

  switch (mode) {
    case "shared":
      await seedSharedHousehold();
      break;
    case "test":
      await seedTestHousehold();
      break;
    case "user":
      await seedUserHousehold();
      break;
    default:
      throw new Error(`Unknown SEED_MODE: ${mode}. Use "user", "shared", or "test".`);
  }
}

run()
  .then(async () => {
    await client.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await client.end();
    process.exit(1);
  });
