import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { babies, households } from "../db/schema";
import { ACTIVITY_RANGES } from "../lib/activity-range";
import { isValidTimezone } from "../lib/timezone";
import { authenticated } from "./auth";

// Query fields shared by the feed and pumping list endpoints.
export const activityListQuerySchema = authenticated.extend({
  babyId: z.string().uuid().nullable().optional(),
  since: z.string().datetime().nullable(),
  range: z.enum(ACTIVITY_RANGES).default("all"),
  timezone: z.string().max(64).nullable().optional(),
  date: z.string().date().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export async function resolveRangeTimezone(
  requestedTimezone: string | null | undefined,
  babyId: string | null | undefined,
) {
  if (requestedTimezone && isValidTimezone(requestedTimezone)) {
    return requestedTimezone;
  }
  if (!babyId) {
    return "UTC";
  }
  const [household] = await db
    .select({ timezone: households.timezone })
    .from(babies)
    .innerJoin(households, eq(households.id, babies.householdId))
    .where(eq(babies.id, babyId))
    .limit(1);
  return household?.timezone ?? "UTC";
}
