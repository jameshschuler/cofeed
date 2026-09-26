import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, lt, type SQL } from "drizzle-orm";
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
import {
  authenticated,
  authenticate,
  requireBabyMembership,
  requireBabyWriteAccess,
} from "./auth";
import {
  activityListQuerySchema,
  getRangeBounds,
  resolveRangeTimezone,
} from "./activity-range";

const updateFeedRequestSchema = z.object({
  accessToken: z.string().min(1),
  feedId: z.string().uuid(),
  startedAt: z.string().datetime(),
  formulaPortionVolume: z.number().nonnegative().nullable(),
  formulaPortionUnit: volumeUnitSchema.nullable(),
  breastMilkPortionVolume: z.number().nonnegative().nullable(),
  breastMilkPortionUnit: volumeUnitSchema.nullable(),
});

export const listFeeds = createServerFn({ method: "GET" })
  .validator(activityListQuerySchema)
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    // Without a babyId, logs from every household the user belongs to are
    // returned; the householdMembers join below enforces access.
    const conditions: SQL[] = [];
    if (data.babyId) {
      await requireBabyMembership(data.babyId, userId);
      conditions.push(eq(feedLogs.babyId, data.babyId));
    }
    const { since, until } = getRangeBounds(
      data.range,
      data.date,
      data.since,
      await resolveRangeTimezone(data.timezone, data.babyId),
    );
    if (since) {
      conditions.push(gte(feedLogs.startedAt, since));
    }
    if (until) {
      conditions.push(lt(feedLogs.startedAt, until));
    }
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
    await requireBabyWriteAccess(data.babyId, userId);
    const [existing] = await db
      .select()
      .from(feedLogs)
      .where(
        and(
          eq(feedLogs.idempotencyKey, data.idempotencyKey),
          eq(feedLogs.babyId, data.babyId),
        ),
      )
      .limit(1);
    if (existing) {
      return existing;
    }
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

export const updateFeed = createServerFn({ method: "POST" })
  .validator(updateFeedRequestSchema)
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [feed] = await db
      .select({ babyId: feedLogs.babyId })
      .from(feedLogs)
      .where(eq(feedLogs.id, data.feedId))
      .limit(1);
    if (!feed) {
      throw new Error("Feed not found.");
    }
    await requireBabyWriteAccess(feed.babyId, userId);
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
    if (!feed) {
      throw new Error("Feed not found.");
    }
    await requireBabyWriteAccess(feed.babyId, userId);
    await db.delete(feedLogs).where(eq(feedLogs.id, data.feedId));
    return null;
  });
