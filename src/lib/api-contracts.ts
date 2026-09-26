import { getZonedTodayKey } from "./timezone";
import { z } from "zod";

export const volumeUnitSchema = z.enum(["oz", "ml"]);
export const activitySourceSchema = z.enum(["cofeed", "nara"]);

export const createFeedRequestSchema = z.object({
  babyId: z.string().uuid(),
  startedAt: z.string().datetime(),
  formulaPortionVolume: z.number().nonnegative().nullable().default(null),
  formulaPortionUnit: volumeUnitSchema.nullable().default(null),
  breastMilkPortionVolume: z.number().nonnegative().nullable().default(null),
  breastMilkPortionUnit: volumeUnitSchema.nullable().default(null),
  source: activitySourceSchema.default("cofeed"),
  idempotencyKey: z.string().uuid(),
});

export const createPumpingRequestSchema = z.object({
  babyId: z.string().uuid(),
  startedAt: z.string().datetime(),
  volume: z.number().positive(),
  unit: volumeUnitSchema,
  source: activitySourceSchema.default("cofeed"),
  idempotencyKey: z.string().uuid(),
});

export const babyProfileFieldsSchema = z.object({
  babyId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  dateOfBirth: z.string().date(),
  // The user's timezone decides what "today" is for the future-date check.
  timezone: z.string().max(64).nullable().optional(),
});

export function withDateOfBirthCheck<
  T extends z.ZodType<{ dateOfBirth: string; timezone?: string | null }>,
>(schema: T) {
  return schema.refine((value) => value.dateOfBirth <= getZonedTodayKey(value.timezone), {
    message: "Date of birth cannot be in the future.",
    path: ["dateOfBirth"],
  });
}

export const updateBabyProfileRequestSchema = withDateOfBirthCheck(babyProfileFieldsSchema);

export const feedResponseSchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  startedAt: z.string().datetime(),
  formulaPortionVolume: z.number().nullable(),
  formulaPortionUnit: volumeUnitSchema.nullable(),
  breastMilkPortionVolume: z.number().nullable(),
  breastMilkPortionUnit: volumeUnitSchema.nullable(),
  source: activitySourceSchema,
  createdByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
  serverReceivedAt: z.string().datetime(),
});

export const listFeedsRequestSchema = z.object({
  babyId: z.string().uuid().nullable().optional(),
  since: z.string().datetime().nullable().optional(),
  range: z.enum(["today", "week", "all", "date", "yesterday"]).default("all"),
  timezone: z.string().max(64).nullable().optional(),
  date: z.string().date().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type CreateFeedRequest = z.infer<typeof createFeedRequestSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;
export type ListFeedsRequest = z.infer<typeof listFeedsRequestSchema>;
