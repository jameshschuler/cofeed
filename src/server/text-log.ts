import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { userPreferences } from "../db/schema";
import {
  MAX_ACTIVITY_TEXT_LENGTH,
  describeActivity,
  toActivitiesToLog,
} from "../lib/activity-text";
import { resolveRangeTimezone } from "./activity-range";
import { parseActivityText } from "./activity-text-parser";
import { insertFeed, insertPumping } from "./activity-writes";
import { authenticated, authenticate, requireBabyWriteAccess } from "./auth";

export const logActivityFromText = createServerFn({ method: "POST" })
  .validator(
    authenticated.extend({
      babyId: z.string().uuid(),
      text: z.string().trim().min(1).max(MAX_ACTIVITY_TEXT_LENGTH),
      timezone: z.string().max(64).nullable().optional(),
      requestId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    await requireBabyWriteAccess(data.babyId, userId);
    const timezone = await resolveRangeTimezone(data.timezone, data.babyId);
    const [preferences] = await db
      .select({ displayVolumeUnit: userPreferences.displayVolumeUnit })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    const now = new Date();

    const parsed = await parseActivityText(data.text, {
      now,
      timezone,
      defaultUnit: preferences?.displayVolumeUnit ?? "oz",
    });
    if (!parsed) {
      return { created: [], notUnderstood: data.text };
    }

    const { activities, problems } = toActivitiesToLog(parsed, { now, timezone });
    const created = await db.transaction(async (tx) => {
      const results: Array<{
        kind: "feed" | "pumping";
        id: string;
        startedAt: string;
        summary: string;
      }> = [];
      for (const [index, activity] of activities.entries()) {
        const idempotencyKey = `text:${data.requestId}:${index}`;
        const row =
          activity.kind === "feed"
            ? await insertFeed(tx, userId, {
                babyId: data.babyId,
                startedAt: activity.startedAt,
                formulaPortionVolume: activity.formula?.volume ?? null,
                formulaPortionUnit: activity.formula?.unit ?? null,
                breastMilkPortionVolume: activity.breastMilk?.volume ?? null,
                breastMilkPortionUnit: activity.breastMilk?.unit ?? null,
                source: "cofeed",
                idempotencyKey,
              })
            : await insertPumping(tx, userId, {
                babyId: data.babyId,
                startedAt: activity.startedAt,
                volume: activity.volume,
                unit: activity.unit,
                source: "cofeed",
                idempotencyKey,
              });
        results.push({
          kind: activity.kind,
          id: row.id,
          startedAt: row.startedAt.toISOString(),
          summary: describeActivity(activity),
        });
      }
      return results;
    });

    const notUnderstood =
      [
        parsed.notUnderstood,
        problems.length ? `Couldn't use ${problems.join(", ")}.` : null,
      ]
        .filter(Boolean)
        .join(" ") || null;
    return { created, notUnderstood };
  });
