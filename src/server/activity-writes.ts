import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { feedLogs, pumpingLogs } from "../db/schema";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = typeof db | Transaction;

export type FeedInsert = Omit<
  typeof feedLogs.$inferInsert,
  "id" | "createdByUserId" | "serverReceivedAt" | "createdAt" | "updatedAt"
>;

export type PumpingInsert = Omit<
  typeof pumpingLogs.$inferInsert,
  "id" | "createdByUserId" | "createdAt" | "updatedAt"
>;

export async function insertFeed(
  executor: DbExecutor,
  userId: string,
  input: FeedInsert,
) {
  const [existing] = await executor
    .select()
    .from(feedLogs)
    .where(
      and(
        eq(feedLogs.idempotencyKey, input.idempotencyKey),
        eq(feedLogs.babyId, input.babyId),
      ),
    )
    .limit(1);
  if (existing) {
    return existing;
  }
  const [feed] = await executor
    .insert(feedLogs)
    .values({ ...input, createdByUserId: userId })
    .returning();
  return feed;
}

export async function insertPumping(
  executor: DbExecutor,
  userId: string,
  input: PumpingInsert,
) {
  const [existing] = await executor
    .select()
    .from(pumpingLogs)
    .where(
      and(
        eq(pumpingLogs.idempotencyKey, input.idempotencyKey),
        eq(pumpingLogs.babyId, input.babyId),
      ),
    )
    .limit(1);
  if (existing) {
    return existing;
  }
  const [session] = await executor
    .insert(pumpingLogs)
    .values({ ...input, createdByUserId: userId })
    .returning();
  return session;
}
