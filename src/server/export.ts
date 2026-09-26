import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import {
  babies,
  feedLogs,
  householdMembers,
  households,
  pumpingLogs,
} from "../db/schema";
import { formatZonedDateTime } from "../lib/timezone";
import { authenticated, authenticate } from "./auth";
import { resolveRangeTimezone } from "./activity-range";

function csvCell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  // Neutralize spreadsheet formula injection (Excel/Sheets execute leading =, +, -, @).
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

export const exportActivityCsv = createServerFn({ method: "GET" })
  .validator(
    authenticated.extend({ timezone: z.string().max(64).nullable().optional() }),
  )
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const timezone = await resolveRangeTimezone(data.timezone, null);
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
        formatZonedDateTime(row.startedAt, timezone),
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
