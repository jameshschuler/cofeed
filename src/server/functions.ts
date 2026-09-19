import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import {
  authUsers,
  babies,
  feedLogs,
  householdMembers,
  households,
  userPreferences,
} from "../db/schema";
import { createFeedRequestSchema, volumeUnitSchema } from "../lib/api-contracts";

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

export const listFeeds = createServerFn({ method: "GET" })
  .validator(
    authenticated.extend({
      babyId: z.string().uuid(),
      since: z.string().datetime().nullable(),
      limit: z.number().int().min(1).max(100).default(50),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    await requireBabyMembership(data.babyId, userId);
    const conditions = [eq(feedLogs.babyId, data.babyId)];
    if (data.since) conditions.push(gte(feedLogs.startedAt, new Date(data.since)));
    const feeds = await db
      .select({
        id: feedLogs.id,
        started_at: feedLogs.startedAt,
        formula_portion_volume: feedLogs.formulaPortionVolume,
        formula_portion_unit: feedLogs.formulaPortionUnit,
        breast_milk_portion_volume: feedLogs.breastMilkPortionVolume,
        breast_milk_portion_unit: feedLogs.breastMilkPortionUnit,
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

    return feeds.map(({ logger_email, profile_name, started_at, ...feed }) => ({
      ...feed,
      started_at: started_at.toISOString(),
      logger_name: profile_name ?? logger_email?.split("@")[0] ?? null,
    }));
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
        idempotencyKey: data.idempotencyKey,
        createdByUserId: userId,
      })
      .returning();
    return feed;
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
