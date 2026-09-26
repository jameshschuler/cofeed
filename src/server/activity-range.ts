import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { babies, households } from "../db/schema";
import {
  getZonedDateStart,
  getZonedDayStart,
  getZonedDaysAgoStart,
  isValidTimezone,
} from "../lib/timezone";
import { authenticated } from "./auth";

// Query fields shared by the feed and pumping list endpoints.
export const activityListQuerySchema = authenticated.extend({
  babyId: z.string().uuid().nullable().optional(),
  since: z.string().datetime().nullable(),
  range: z.enum(["today", "week", "all", "date", "yesterday"]).default("all"),
  timezone: z.string().max(64).nullable().optional(),
  date: z.string().date().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export function getRangeBounds(
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
    return {
      since: getZonedDateStart(date, timezone),
      until: getZonedDateStart(date, timezone, 1),
    };
  }
  return { since: since ? new Date(since) : null, until: null as Date | null };
}

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
