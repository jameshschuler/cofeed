import "dotenv/config";

import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, client } from "../client";
import { buildSeedSchedule } from "./schedule";
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
const CO_PARENT_EMAIL = "jameshschuler1+test1@gmail.com";
const TEST_JOIN_CODE = "TEST42";

type Role = "owner" | "caregiver";

function generateJoinCode() {
  return randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
}

async function resolveUserIdByEmail(email: string) {
  const [user] = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, email))
    .limit(1);

  if (!user) {
    throw new Error(`No auth.users row found for email: ${email}`);
  }

  return user.id;
}

async function findHouseholdByJoinCode(joinCode: string) {
  const [household] = await db
    .select({ id: households.id })
    .from(households)
    .where(eq(households.joinCode, joinCode))
    .limit(1);
  return household?.id ?? null;
}

async function createHousehold(name: string, joinCode = generateJoinCode()) {
  const [household] = await db
    .insert(households)
    .values({ name, timezone: "America/New_York", joinCode })
    .returning({ id: households.id });
  return household.id;
}

async function getDefaultHouseholdId(userId: string) {
  const [membership] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(
      and(eq(householdMembers.userId, userId), eq(householdMembers.isDefault, true)),
    )
    .limit(1);
  return membership?.householdId ?? null;
}

// Adds the membership if missing; an existing membership keeps its role.
async function ensureMembership(householdId: string, userId: string, role: Role) {
  await db
    .insert(householdMembers)
    .values({ householdId, userId, role })
    .onConflictDoNothing({
      target: [householdMembers.householdId, householdMembers.userId],
    });
}

// Seeds insert memberships directly, so mark each seeded user's default household:
// the one they own, otherwise their earliest membership.
async function ensureDefaultMembership(userId: string) {
  if (await getDefaultHouseholdId(userId)) {
    return;
  }

  const [membership] = await db
    .select({ id: householdMembers.id })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .orderBy(sql`${householdMembers.role} = 'owner' desc`, householdMembers.createdAt)
    .limit(1);
  if (!membership) {
    return;
  }

  await db
    .update(householdMembers)
    .set({ isDefault: true })
    .where(eq(householdMembers.id, membership.id));
}

async function findOrCreateBaby(
  householdId: string,
  values: Omit<typeof babies.$inferInsert, "householdId">,
) {
  const [existing] = await db
    .select({ id: babies.id })
    .from(babies)
    .where(eq(babies.householdId, householdId))
    .orderBy(babies.createdAt)
    .limit(1);
  if (existing) {
    return existing.id;
  }

  const [baby] = await db
    .insert(babies)
    .values({ householdId, ...values })
    .returning({ id: babies.id });
  return baby.id;
}

// Sets display units to ml; keeps any profile name the user already chose.
async function upsertPreferences(userId: string, profileName: string) {
  await db
    .insert(userPreferences)
    .values({ userId, profileName, displayVolumeUnit: "ml" })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        profileName: sql`coalesce(${userPreferences.profileName}, excluded.profile_name)`,
        displayVolumeUnit: "ml",
        updatedAt: new Date(),
      },
    });
}

// The seed user's default household, shared with a co-parent, with the last week of
// feeds (logged by both) and pumping sessions. Feeds and pumping logs are replaced on every run so reruns
// always show recent data.
async function seedUserHousehold() {
  const seedEmail = process.env.SEED_USER_EMAIL ?? DEFAULT_SEED_EMAIL;
  const userId = await resolveUserIdByEmail(seedEmail);
  const coParentId = await resolveUserIdByEmail(CO_PARENT_EMAIL);

  let householdId = await getDefaultHouseholdId(userId);
  if (!householdId) {
    householdId = await createHousehold("CoFeed Household");
    await db
      .insert(householdMembers)
      .values({ householdId, userId, role: "owner", isDefault: true });
  }

  await ensureMembership(householdId, coParentId, "caregiver");
  await ensureDefaultMembership(coParentId);
  await upsertPreferences(userId, seedEmail.split("@")[0]);
  await upsertPreferences(coParentId, "Co-parent");

  const babyId = await findOrCreateBaby(householdId, {
    name: "CoFeed Baby",
    dateOfBirth: "2026-06-01",
  });

  await db.delete(feedLogs).where(eq(feedLogs.babyId, babyId));
  await db.delete(pumpingLogs).where(eq(pumpingLogs.babyId, babyId));

  const { feeds, pumps } = buildSeedSchedule();

  await db.insert(feedLogs).values(
    feeds.map((feed) => ({
      babyId,
      startedAt: feed.startedAt,
      formulaPortionVolume: feed.formulaMl || null,
      formulaPortionUnit: feed.formulaMl ? ("ml" as const) : null,
      breastMilkPortionVolume: feed.breastMilkMl || null,
      breastMilkPortionUnit: feed.breastMilkMl ? ("ml" as const) : null,
      idempotencyKey: randomUUID(),
      createdByUserId: feed.slot % 2 === 0 ? userId : coParentId,
    })),
  );

  await db.insert(pumpingLogs).values(
    pumps.map((pump) => ({
      babyId,
      startedAt: pump.startedAt,
      volume: pump.volumeMl,
      unit: "ml" as const,
      idempotencyKey: randomUUID(),
      createdByUserId: userId,
    })),
  );

  console.log("Seeded user household", { seedEmail, userId, householdId, babyId });
}

// A household with no members, for testing joining by code.
async function seedTestHousehold() {
  const existingId = await findHouseholdByJoinCode(TEST_JOIN_CODE);
  if (existingId) {
    console.log("Test household already exists", {
      householdId: existingId,
      joinCode: TEST_JOIN_CODE,
    });
    return;
  }

  const householdId = await createHousehold("CoFeed Test Household", TEST_JOIN_CODE);
  const babyId = await findOrCreateBaby(householdId, {
    name: "Test Baby",
    dateOfBirth: "2026-06-01",
  });

  console.log("Test household seeded", {
    householdId,
    babyId,
    joinCode: TEST_JOIN_CODE,
  });
}

async function run() {
  await seedUserHousehold();
  await seedTestHousehold();
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
