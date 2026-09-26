import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, lt, type SQL } from "drizzle-orm";
import { db } from "../db/client";
import {
  authUsers,
  babies,
  householdMembers,
  households,
  pumpingLogs,
  userPreferences,
} from "../db/schema";
import { createPumpingRequestSchema } from "../lib/api-contracts";
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
    const [existing] = await db
      .select()
      .from(pumpingLogs)
      .where(
        and(
          eq(pumpingLogs.idempotencyKey, data.idempotencyKey),
          eq(pumpingLogs.babyId, data.babyId),
        ),
      )
      .limit(1);
    if (existing) {
      return existing;
    }
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
