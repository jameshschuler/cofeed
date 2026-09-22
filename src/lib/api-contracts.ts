import { z } from "zod";

export const volumeUnitSchema = z.enum(["oz", "ml"]);

export const createFeedRequestSchema = z.object({
  babyId: z.string().uuid(),
  startedAt: z.string().datetime(),
  formulaPortionVolume: z.number().nonnegative().nullable().default(null),
  formulaPortionUnit: volumeUnitSchema.nullable().default(null),
  breastMilkPortionVolume: z.number().nonnegative().nullable().default(null),
  breastMilkPortionUnit: volumeUnitSchema.nullable().default(null),
  idempotencyKey: z.string().uuid(),
});

export const createPumpingRequestSchema = z.object({
  babyId: z.string().uuid(),
  startedAt: z.string().datetime(),
  volume: z.number().positive(),
  unit: volumeUnitSchema,
  idempotencyKey: z.string().uuid(),
});

export const feedResponseSchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  startedAt: z.string().datetime(),
  formulaPortionVolume: z.number().nullable(),
  formulaPortionUnit: volumeUnitSchema.nullable(),
  breastMilkPortionVolume: z.number().nullable(),
  breastMilkPortionUnit: volumeUnitSchema.nullable(),
  createdByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
  serverReceivedAt: z.string().datetime(),
});

export const listFeedsRequestSchema = z.object({
  babyId: z.string().uuid(),
  since: z.string().datetime().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type CreateFeedRequest = z.infer<typeof createFeedRequestSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;
export type ListFeedsRequest = z.infer<typeof listFeedsRequestSchema>;
