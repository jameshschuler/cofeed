import { z } from "zod";
import { formatZonedDateTime, zonedLocalDateTimeToUtc } from "./timezone";
import { getMaxPortionVolume } from "./volume";
import type { VolumeUnit } from "../types/route-types";

export const MAX_ACTIVITY_TEXT_LENGTH = 500;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

const unitSchema = z.enum(["oz", "ml"]);
const portionSchema = z.object({ volume: z.number(), unit: unitSchema }).nullable();
const timeSchema = z
  .string()
  .nullable()
  .describe('Local time as "YYYY-MM-DDTHH:mm", or null when no time was mentioned.');

// The shape Claude fills in. Kept free of numeric/format constraints so it stays within
// what structured outputs support; entries are validated after parsing.
export const parsedActivityTextSchema = z.object({
  entries: z.array(
    z.discriminatedUnion("kind", [
      z.object({
        kind: z.literal("feed"),
        time: timeSchema,
        formula: portionSchema,
        breastMilk: portionSchema,
      }),
      z.object({
        kind: z.literal("pumping"),
        time: timeSchema,
        volume: z.number(),
        unit: unitSchema,
      }),
    ]),
  ),
  notUnderstood: z
    .string()
    .nullable()
    .describe("Any part of the note that isn't a feed or pumping amount, else null."),
});

export type ParsedActivityText = z.infer<typeof parsedActivityTextSchema>;

type Portion = { volume: number; unit: VolumeUnit } | null;

export type FeedToLog = {
  kind: "feed";
  startedAt: Date;
  formula: Portion;
  breastMilk: Portion;
};

export type PumpingToLog = {
  kind: "pumping";
  startedAt: Date;
  volume: number;
  unit: VolumeUnit;
};

export type ActivityToLog = FeedToLog | PumpingToLog;

function isValidVolume(volume: number, unit: VolumeUnit) {
  return Number.isFinite(volume) && volume > 0 && volume <= getMaxPortionVolume(unit);
}

function resolveTime(time: string | null, now: Date, timezone: string) {
  if (time === null) {
    return now;
  }
  const startedAt = zonedLocalDateTimeToUtc(time, timezone);
  if (!startedAt || startedAt.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
    return null;
  }
  return startedAt;
}

export function toActivitiesToLog(
  parsed: ParsedActivityText,
  { now, timezone }: { now: Date; timezone: string },
) {
  const activities: ActivityToLog[] = [];
  const problems: string[] = [];

  for (const entry of parsed.entries) {
    const startedAt = resolveTime(entry.time, now, timezone);
    if (!startedAt) {
      problems.push(`a ${entry.kind === "feed" ? "feed" : "pumping session"} time`);
      continue;
    }

    if (entry.kind === "pumping") {
      if (!isValidVolume(entry.volume, entry.unit)) {
        problems.push(`a pumping amount of ${entry.volume} ${entry.unit}`);
        continue;
      }
      activities.push({
        kind: "pumping",
        startedAt,
        volume: entry.volume,
        unit: entry.unit,
      });
      continue;
    }

    const portions = [entry.formula, entry.breastMilk];
    const invalid = portions.find(
      (portion) => portion && !isValidVolume(portion.volume, portion.unit),
    );
    if (invalid) {
      problems.push(`a feed amount of ${invalid.volume} ${invalid.unit}`);
      continue;
    }
    if (!entry.formula && !entry.breastMilk) {
      problems.push("a feed without an amount");
      continue;
    }
    activities.push({
      kind: "feed",
      startedAt,
      formula: entry.formula,
      breastMilk: entry.breastMilk,
    });
  }

  return { activities, problems };
}

function formatPortion(portion: { volume: number; unit: VolumeUnit }) {
  return `${portion.volume} ${portion.unit}`;
}

export function describeActivity(activity: ActivityToLog) {
  if (activity.kind === "pumping") {
    return `pumped ${formatPortion(activity)}`;
  }
  const parts = [
    activity.formula && `${formatPortion(activity.formula)} formula`,
    activity.breastMilk && `${formatPortion(activity.breastMilk)} breast milk`,
  ].filter(Boolean);
  return `fed ${parts.join(" + ")}`;
}

export function formatLocalNow(now: Date, timezone: string) {
  const local = formatZonedDateTime(now, timezone);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  }).format(now);
  return `${local} (${weekday})`;
}
