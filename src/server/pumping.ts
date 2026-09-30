import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, lt, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import {
  authUsers,
  babies,
  householdMembers,
  households,
  pumpingLogs,
  userPreferences,
} from "../db/schema";
import { createPumpingRequestSchema, volumeUnitSchema } from "../lib/api-contracts";
import {
  authenticated,
  authenticate,
  requireBabyMembership,
  requireBabyWriteAccess,
} from "./auth";
import { activityListQuerySchema, resolveRangeTimezone } from "./activity-range";
import { getRangeBounds } from "../lib/activity-range";
import { insertPumping } from "./activity-writes";

export const listPumpingLogs = createServerFn({ method: "GET" })
  .validator(activityListQuerySchema)
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    // Without a babyId, logs from every household the user belongs to are
    // returned; the householdMembers join below enforces access.
    const conditions: SQL[] = [];
    if (data.babyId) {
      await requireBabyMembership(data.babyId, userId);
      conditions.push(eq(pumpingLogs.babyId, data.babyId));
    }
    const { since, until } = getRangeBounds(
      data.range,
      data.date,
      data.since,
      await resolveRangeTimezone(data.timezone, data.babyId),
    );
    if (since) {
      conditions.push(gte(pumpingLogs.startedAt, since));
    }
    if (until) {
      conditions.push(lt(pumpingLogs.startedAt, until));
    }
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
    await requireBabyWriteAccess(data.babyId, userId);
    return insertPumping(db, userId, {
      babyId: data.babyId,
      startedAt: new Date(data.startedAt),
      volume: data.volume,
      unit: data.unit,
      source: data.source,
      idempotencyKey: data.idempotencyKey,
    });
  });

export const deletePumpingLog = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ pumpingLogId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [session] = await db
      .select({ babyId: pumpingLogs.babyId })
      .from(pumpingLogs)
      .where(eq(pumpingLogs.id, data.pumpingLogId))
      .limit(1);
    if (!session) {
      return null;
    }
    await requireBabyWriteAccess(session.babyId, userId);
    await db.delete(pumpingLogs).where(eq(pumpingLogs.id, data.pumpingLogId));
    return null;
  });

export const updatePumpingLog = createServerFn({ method: "POST" })
  .validator(
    authenticated.extend({
      pumpingLogId: z.string().uuid(),
      startedAt: z.string().datetime(),
      volume: z.number().positive(),
      unit: volumeUnitSchema,
    }),
  )
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [session] = await db
      .select({ babyId: pumpingLogs.babyId })
      .from(pumpingLogs)
      .where(eq(pumpingLogs.id, data.pumpingLogId))
      .limit(1);
    if (!session) {
      throw new Error("Pumping session not found.");
    }
    await requireBabyWriteAccess(session.babyId, userId);
    const [updated] = await db
      .update(pumpingLogs)
      .set({
        startedAt: new Date(data.startedAt),
        volume: data.volume,
        unit: data.unit,
        updatedAt: new Date(),
      })
      .where(eq(pumpingLogs.id, data.pumpingLogId))
      .returning();
    return updated;
  });
