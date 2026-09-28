import { and, eq } from "drizzle-orm";
import { householdMembers } from "../db/schema";
import { pickPreferredHousehold } from "../lib/preferred-household";
import type { DbExecutor } from "./activity-writes";

export async function ensurePreferredHousehold(executor: DbExecutor, userId: string) {
  const memberships = await executor
    .select({
      householdId: householdMembers.householdId,
      role: householdMembers.role,
      isDefault: householdMembers.isDefault,
      createdAt: householdMembers.createdAt,
    })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId));

  const householdId = pickPreferredHousehold(memberships);
  if (householdId && !memberships.some((membership) => membership.isDefault)) {
    await executor
      .update(householdMembers)
      .set({ isDefault: true })
      .where(
        and(
          eq(householdMembers.userId, userId),
          eq(householdMembers.householdId, householdId),
        ),
      );
  }
  return householdId;
}

// Clears the old preferred flag before setting the new one; at most one may be set per user.
export async function setPreferredMembership(
  executor: DbExecutor,
  userId: string,
  householdId: string,
) {
  await executor
    .update(householdMembers)
    .set({ isDefault: false })
    .where(
      and(eq(householdMembers.userId, userId), eq(householdMembers.isDefault, true)),
    );
  const updated = await executor
    .update(householdMembers)
    .set({ isDefault: true })
    .where(
      and(
        eq(householdMembers.userId, userId),
        eq(householdMembers.householdId, householdId),
      ),
    )
    .returning({ householdId: householdMembers.householdId });
  if (updated.length === 0) {
    throw new Error("You're not a member of that household.");
  }
}
