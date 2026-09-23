import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import {
  authUsers,
  babies,
  feedLogs,
  householdMembers,
  households,
  pumpingLogs,
  userPreferences,
} from "../db/schema";
import {
  createFeedRequestSchema,
  createPumpingRequestSchema,
  updateBabyProfileRequestSchema,
  volumeUnitSchema,
} from "../lib/api-contracts";
import { getZonedDayStart, getZonedDaysAgoStart } from "../lib/timezone";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
);

const authenticated = z.object({ accessToken: z.string().min(1) });

const updateFeedRequestSchema = z.object({
  accessToken: z.string().min(1),
  feedId: z.string().uuid(),
  startedAt: z.string().datetime(),
  formulaPortionVolume: z.number().nonnegative().nullable(),
  formulaPortionUnit: volumeUnitSchema.nullable(),
  breastMilkPortionVolume: z.number().nonnegative().nullable(),
  breastMilkPortionUnit: volumeUnitSchema.nullable(),
});

async function authenticate(accessToken: string) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error("Invalid session.");
  }
  return data.user.id;
}

async function requireBabyMembership(babyId: string, userId: string) {
  const [membership] = await db
    .select({ householdId: householdMembers.householdId })
    .from(babies)
    .innerJoin(householdMembers, eq(householdMembers.householdId, babies.householdId))
    .where(and(eq(babies.id, babyId), eq(householdMembers.userId, userId)))
    .limit(1);

  if (!membership) {
    throw new Error("Forbidden.");
  }
}

function getRangeBounds(
  range: "today" | "week" | "all" | "date" | "yesterday",
  date: string | null | undefined,
  since: string | null | undefined,
  timezone: string,
) {
  const now = new Date();
  if (range === "today") {
    return { since: getZonedDayStart(now, timezone), until: null as Date | null };
  }
  if (range === "yesterday") {
    return {
      since: getZonedDaysAgoStart(now, timezone, 1),
      until: getZonedDayStart(now, timezone),
    };
  }
  if (range === "week") {
    return {
      since: getZonedDaysAgoStart(now, timezone, 6),
      until: null as Date | null,
    };
  }
  if (range === "date" && date) {
    const anchor = new Date(`${date}T12:00:00`);
    return {
      since: getZonedDayStart(anchor, timezone),
      until: getZonedDaysAgoStart(anchor, timezone, -1),
    };
  }
  return { since: since ? new Date(since) : null, until: null as Date | null };
}

export const getProfile = createServerFn({ method: "GET" })
  .validator(authenticated)
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [membership] = await db
      .select({ householdId: householdMembers.householdId })
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1);
    let householdId = membership?.householdId;

    if (!householdId) {
      const [household] = await db
        .insert(households)
        .values({
          name: "My Household",
          timezone: "UTC",
          joinCode: crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase(),
        })
        .returning({ id: households.id });
      householdId = household.id;
      await db.insert(householdMembers).values({ householdId, userId, role: "owner" });
    }

    let [baby] = await db
      .select({ id: babies.id })
      .from(babies)
      .where(eq(babies.householdId, householdId))
      .limit(1);

    if (!baby) {
      [baby] = await db
        .insert(babies)
        .values({
          householdId,
          name: "Baby",
          dateOfBirth: new Date().toISOString().slice(0, 10),
        })
        .returning({ id: babies.id });
    }

    const [currentMembership] = await db
      .select({ role: householdMembers.role })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);
    const [household] = await db
      .select({ joinCode: households.joinCode })
      .from(households)
      .where(eq(households.id, householdId));

    const [profile] = await db
      .select({ profileName: userPreferences.profileName, email: authUsers.email })
      .from(authUsers)
      .leftJoin(userPreferences, eq(userPreferences.userId, authUsers.id))
      .where(eq(authUsers.id, userId));

    return {
      householdId,
      babyId: baby.id,
      joinCode: household.joinCode,
      memberRole: currentMembership?.role ?? "owner",
      profileName: profile?.profileName ?? profile?.email?.split("@")[0] ?? "Caregiver",
    };
  });

export const updateProfileName = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ profileName: z.string().trim().min(1).max(80) }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [preferences] = await db
      .insert(userPreferences)
      .values({ userId, profileName: data.profileName.trim() })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { profileName: data.profileName.trim(), updatedAt: new Date() },
      })
      .returning({ profileName: userPreferences.profileName });
    return preferences.profileName ?? data.profileName.trim();
  });

export const getBabyProfile = createServerFn({ method: "GET" })
  .validator(authenticated.extend({ babyId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [baby] = await db
      .select({
        id: babies.id,
        name: babies.name,
        dateOfBirth: babies.dateOfBirth,
        householdId: babies.householdId,
        memberRole: householdMembers.role,
      })
      .from(babies)
      .innerJoin(householdMembers, eq(householdMembers.householdId, babies.householdId))
      .where(and(eq(babies.id, data.babyId), eq(householdMembers.userId, userId)))
      .limit(1);
    if (!baby) throw new Error("Forbidden.");
    return baby;
  });

export const updateBabyProfile = createServerFn({ method: "POST" })
  .validator(authenticated.extend(updateBabyProfileRequestSchema.shape))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [owner] = await db
      .select({ role: householdMembers.role })
      .from(babies)
      .innerJoin(householdMembers, eq(householdMembers.householdId, babies.householdId))
      .where(and(eq(babies.id, data.babyId), eq(householdMembers.userId, userId)))
      .limit(1);
    if (owner?.role !== "owner")
      throw new Error("Only household owners can update the baby profile.");

    const [baby] = await db
      .update(babies)
      .set({
        name: data.name.trim(),
        dateOfBirth: data.dateOfBirth,
        updatedAt: new Date(),
      })
      .where(eq(babies.id, data.babyId))
      .returning({ id: babies.id, name: babies.name, dateOfBirth: babies.dateOfBirth });
    return baby;
  });

export const getPreferences = createServerFn({ method: "GET" })
  .validator(authenticated)
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [preferences] = await db
      .select({ displayVolumeUnit: userPreferences.displayVolumeUnit })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences ?? { displayVolumeUnit: "oz" as const };
  });

export const updatePreferences = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ displayVolumeUnit: volumeUnitSchema }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [preferences] = await db
      .insert(userPreferences)
      .values({ userId, displayVolumeUnit: data.displayVolumeUnit })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { displayVolumeUnit: data.displayVolumeUnit, updatedAt: new Date() },
      })
      .returning();
    return preferences;
  });

export const listHouseholds = createServerFn({ method: "GET" })
  .validator(authenticated)
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const memberships = await db
      .select({
        household_id: households.id,
        household_name: households.name,
        join_code: households.joinCode,
        member_role: householdMembers.role,
      })
      .from(householdMembers)
      .innerJoin(households, eq(households.id, householdMembers.householdId))
      .where(eq(householdMembers.userId, userId));
    return Array.from(
      new Map(
        memberships.map((membership) => [membership.household_id, membership]),
      ).values(),
    );
  });

export const joinHousehold = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ joinCode: z.string().length(6) }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [household] = await db
      .select({ id: households.id })
      .from(households)
      .where(eq(households.joinCode, data.joinCode.trim().toUpperCase()))
      .limit(1);
    if (!household) throw new Error("Household not found.");
    await db
      .insert(householdMembers)
      .values({ householdId: household.id, userId, role: "caregiver" })
      .onConflictDoNothing();
    return { householdId: household.id };
  });

export const leaveHousehold = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ householdId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [membership] = await db
      .select({ role: householdMembers.role })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);
    if (!membership) throw new Error("Household membership not found.");
    if (membership.role === "owner") {
      throw new Error("Owners cannot leave their household.");
    }
    await db
      .delete(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, userId),
        ),
      );
    return null;
  });

export const listHouseholdMembers = createServerFn({ method: "GET" })
  .validator(authenticated.extend({ householdId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [viewer] = await db
      .select({ role: householdMembers.role })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);
    if (!viewer) throw new Error("Forbidden.");

    return db
      .select({
        user_id: householdMembers.userId,
        member_role: householdMembers.role,
        email: authUsers.email,
        profile_name: userPreferences.profileName,
      })
      .from(householdMembers)
      .innerJoin(authUsers, eq(authUsers.id, householdMembers.userId))
      .leftJoin(userPreferences, eq(userPreferences.userId, householdMembers.userId))
      .where(eq(householdMembers.householdId, data.householdId));
  });

export const removeHouseholdMember = createServerFn({ method: "POST" })
  .validator(
    authenticated.extend({
      householdId: z.string().uuid(),
      memberUserId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [owner] = await db
      .select({ role: householdMembers.role })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);
    if (owner?.role !== "owner")
      throw new Error("Only household owners can remove members.");
    if (data.memberUserId === userId)
      throw new Error("Owners cannot remove themselves.");

    await db
      .delete(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, data.memberUserId),
        ),
      );
    return null;
  });

export const listFeeds = createServerFn({ method: "GET" })
  .validator(
    authenticated.extend({
      babyId: z.string().uuid(),
      since: z.string().datetime().nullable(),
      range: z.enum(["today", "week", "all", "date", "yesterday"]).default("all"),
      date: z.string().date().nullable().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    await requireBabyMembership(data.babyId, userId);
    const conditions = [eq(feedLogs.babyId, data.babyId)];
    const [household] = await db
      .select({ timezone: households.timezone })
      .from(babies)
      .innerJoin(households, eq(households.id, babies.householdId))
      .where(eq(babies.id, data.babyId))
      .limit(1);
    const { since, until } = getRangeBounds(
      data.range,
      data.date,
      data.since,
      household.timezone,
    );
    if (since) conditions.push(gte(feedLogs.startedAt, since));
    if (until) conditions.push(lt(feedLogs.startedAt, until));
    const feeds = await db
      .select({
        id: feedLogs.id,
        started_at: feedLogs.startedAt,
        created_at: feedLogs.createdAt,
        formula_portion_volume: feedLogs.formulaPortionVolume,
        formula_portion_unit: feedLogs.formulaPortionUnit,
        breast_milk_portion_volume: feedLogs.breastMilkPortionVolume,
        breast_milk_portion_unit: feedLogs.breastMilkPortionUnit,
        source: feedLogs.source,
        household_name: households.name,
        logger_email: authUsers.email,
        profile_name: userPreferences.profileName,
      })
      .from(feedLogs)
      .innerJoin(babies, eq(babies.id, feedLogs.babyId))
      .innerJoin(households, eq(households.id, babies.householdId))
      .innerJoin(
        householdMembers,
        and(
          eq(householdMembers.householdId, households.id),
          eq(householdMembers.userId, userId),
        ),
      )
      .leftJoin(authUsers, eq(authUsers.id, feedLogs.createdByUserId))
      .leftJoin(userPreferences, eq(userPreferences.userId, feedLogs.createdByUserId))
      .where(and(...conditions))
      .orderBy(desc(feedLogs.startedAt))
      .limit(data.limit);

    return feeds.map(
      ({ logger_email, profile_name, started_at, created_at, ...feed }) => ({
        ...feed,
        started_at: started_at.toISOString(),
        created_at: created_at.toISOString(),
        logger_name: profile_name ?? logger_email?.split("@")[0] ?? null,
      }),
    );
  });

export const createFeed = createServerFn({ method: "POST" })
  .validator(authenticated.extend(createFeedRequestSchema.shape))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    await requireBabyMembership(data.babyId, userId);
    const [existing] = await db
      .select()
      .from(feedLogs)
      .where(eq(feedLogs.idempotencyKey, data.idempotencyKey))
      .limit(1);
    if (existing) return existing;
    const [feed] = await db
      .insert(feedLogs)
      .values({
        babyId: data.babyId,
        startedAt: new Date(data.startedAt),
        formulaPortionVolume: data.formulaPortionVolume,
        formulaPortionUnit: data.formulaPortionUnit,
        breastMilkPortionVolume: data.breastMilkPortionVolume,
        breastMilkPortionUnit: data.breastMilkPortionUnit,
        source: data.source,
        idempotencyKey: data.idempotencyKey,
        createdByUserId: userId,
      })
      .returning();
    return feed;
  });

export const listPumpingLogs = createServerFn({ method: "GET" })
  .validator(
    authenticated.extend({
      babyId: z.string().uuid(),
      since: z.string().datetime().nullable(),
      range: z.enum(["today", "week", "all", "date", "yesterday"]).default("all"),
      date: z.string().date().nullable().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    await requireBabyMembership(data.babyId, userId);
    const conditions = [eq(pumpingLogs.babyId, data.babyId)];
    const [household] = await db
      .select({ timezone: households.timezone })
      .from(babies)
      .innerJoin(households, eq(households.id, babies.householdId))
      .where(eq(babies.id, data.babyId))
      .limit(1);
    const { since, until } = getRangeBounds(
      data.range,
      data.date,
      data.since,
      household.timezone,
    );
    if (since) conditions.push(gte(pumpingLogs.startedAt, since));
    if (until) conditions.push(lt(pumpingLogs.startedAt, until));
    const sessions = await db
      .select({
        id: pumpingLogs.id,
        started_at: pumpingLogs.startedAt,
        created_at: pumpingLogs.createdAt,
        volume: pumpingLogs.volume,
        unit: pumpingLogs.unit,
        source: pumpingLogs.source,
        household_name: households.name,
        logger_email: authUsers.email,
        profile_name: userPreferences.profileName,
      })
      .from(pumpingLogs)
      .innerJoin(babies, eq(babies.id, pumpingLogs.babyId))
      .innerJoin(households, eq(households.id, babies.householdId))
      .innerJoin(
        householdMembers,
        and(
          eq(householdMembers.householdId, households.id),
          eq(householdMembers.userId, userId),
        ),
      )
      .leftJoin(authUsers, eq(authUsers.id, pumpingLogs.createdByUserId))
      .leftJoin(
        userPreferences,
        eq(userPreferences.userId, pumpingLogs.createdByUserId),
      )
      .where(and(...conditions))
      .orderBy(desc(pumpingLogs.startedAt))
      .limit(data.limit);

    return sessions.map(
      ({ logger_email, profile_name, started_at, created_at, ...session }) => ({
        ...session,
        started_at: started_at.toISOString(),
        created_at: created_at.toISOString(),
        logger_name: profile_name ?? logger_email?.split("@")[0] ?? null,
      }),
    );
  });

export const createPumpingLog = createServerFn({ method: "POST" })
  .validator(authenticated.extend(createPumpingRequestSchema.shape))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    await requireBabyMembership(data.babyId, userId);
    const [existing] = await db
      .select()
      .from(pumpingLogs)
      .where(eq(pumpingLogs.idempotencyKey, data.idempotencyKey))
      .limit(1);
    if (existing) return existing;
    const [session] = await db
      .insert(pumpingLogs)
      .values({
        babyId: data.babyId,
        startedAt: new Date(data.startedAt),
        volume: data.volume,
        unit: data.unit,
        source: data.source,
        idempotencyKey: data.idempotencyKey,
        createdByUserId: userId,
      })
      .returning();
    return session;
  });

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export const exportActivityCsv = createServerFn({ method: "GET" })
  .validator(authenticated)
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const feeds = await db
      .select({
        type: sql<string>`'feed'`,
        startedAt: feedLogs.startedAt,
        householdName: households.name,
        babyName: babies.name,
        formulaVolume: feedLogs.formulaPortionVolume,
        formulaUnit: feedLogs.formulaPortionUnit,
        breastMilkVolume: feedLogs.breastMilkPortionVolume,
        breastMilkUnit: feedLogs.breastMilkPortionUnit,
        pumpingVolume: sql<number | null>`NULL`,
        pumpingUnit: sql<string | null>`NULL`,
      })
      .from(feedLogs)
      .innerJoin(babies, eq(babies.id, feedLogs.babyId))
      .innerJoin(households, eq(households.id, babies.householdId))
      .innerJoin(
        householdMembers,
        and(
          eq(householdMembers.householdId, households.id),
          eq(householdMembers.userId, userId),
        ),
      );

    const pumping = await db
      .select({
        type: sql<string>`'pumping'`,
        startedAt: pumpingLogs.startedAt,
        householdName: households.name,
        babyName: babies.name,
        formulaVolume: sql<number | null>`NULL`,
        formulaUnit: sql<string | null>`NULL`,
        breastMilkVolume: sql<number | null>`NULL`,
        breastMilkUnit: sql<string | null>`NULL`,
        pumpingVolume: pumpingLogs.volume,
        pumpingUnit: pumpingLogs.unit,
      })
      .from(pumpingLogs)
      .innerJoin(babies, eq(babies.id, pumpingLogs.babyId))
      .innerJoin(households, eq(households.id, babies.householdId))
      .innerJoin(
        householdMembers,
        and(
          eq(householdMembers.householdId, households.id),
          eq(householdMembers.userId, userId),
        ),
      );

    const rows = [...feeds, ...pumping].sort(
      (left, right) => right.startedAt.getTime() - left.startedAt.getTime(),
    );
    const header = [
      "type",
      "started_at",
      "household",
      "baby",
      "formula_volume",
      "formula_unit",
      "breast_milk_volume",
      "breast_milk_unit",
      "pumping_volume",
      "pumping_unit",
    ];
    const lines = rows.map((row) =>
      [
        row.type,
        row.startedAt.toISOString(),
        row.householdName,
        row.babyName,
        row.formulaVolume,
        row.formulaUnit,
        row.breastMilkVolume,
        row.breastMilkUnit,
        row.pumpingVolume,
        row.pumpingUnit,
      ]
        .map(csvCell)
        .join(","),
    );

    return [header.map(csvCell).join(","), ...lines].join("\n");
  });

export const updateFeed = createServerFn({ method: "POST" })
  .validator(updateFeedRequestSchema)
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [feed] = await db
      .select({ babyId: feedLogs.babyId })
      .from(feedLogs)
      .where(eq(feedLogs.id, data.feedId))
      .limit(1);
    if (!feed) throw new Error("Feed not found.");
    await requireBabyMembership(feed.babyId, userId);
    const [updated] = await db
      .update(feedLogs)
      .set({
        startedAt: new Date(data.startedAt),
        formulaPortionVolume: data.formulaPortionVolume,
        formulaPortionUnit: data.formulaPortionUnit,
        breastMilkPortionVolume: data.breastMilkPortionVolume,
        breastMilkPortionUnit: data.breastMilkPortionUnit,
        updatedAt: new Date(),
      })
      .where(eq(feedLogs.id, data.feedId))
      .returning();
    return updated;
  });

export const deleteFeed = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ feedId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [feed] = await db
      .select({ babyId: feedLogs.babyId })
      .from(feedLogs)
      .where(eq(feedLogs.id, data.feedId))
      .limit(1);
    if (!feed) throw new Error("Feed not found.");
    await requireBabyMembership(feed.babyId, userId);
    await db.delete(feedLogs).where(eq(feedLogs.id, data.feedId));
    return null;
  });
