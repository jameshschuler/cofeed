import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import {
  authUsers,
  babies,
  householdMembers,
  households,
  userPreferences,
} from "../db/schema";
import { householdNameSchema } from "../lib/api-contracts";
import { authenticated, authenticate } from "./auth";
import {
  ensurePreferredHousehold,
  setPreferredMembership,
} from "./preferred-household";

export const listHouseholds = createServerFn({ method: "GET" })
  .validator(authenticated)
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const memberships = await db
      .select({
        household_id: households.id,
        household_name: households.name,
        join_code: households.joinCode,
        member_role: householdMembers.role,
        is_preferred: householdMembers.isDefault,
        baby_id: sql<
          string | null
        >`(select ${babies.id} from ${babies} where ${babies.householdId} = ${households.id} order by ${babies.createdAt} limit 1)`,
      })
      .from(householdMembers)
      .innerJoin(households, eq(households.id, householdMembers.householdId))
      .where(eq(householdMembers.userId, userId));
    return Array.from(
      new Map(
        memberships.map((membership) => [membership.household_id, membership]),
      ).values(),
    );
  });

export const joinHousehold = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ joinCode: z.string().length(6) }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [household] = await db
      .select({ id: households.id, name: households.name })
      .from(households)
      .where(eq(households.joinCode, data.joinCode.trim().toUpperCase()))
      .limit(1);
    if (!household) {
      throw new Error("Household not found.");
    }
    await db
      .insert(householdMembers)
      .values({ householdId: household.id, userId, role: "caregiver" })
      .onConflictDoNothing({
        target: [householdMembers.householdId, householdMembers.userId],
      });
    const [membership] = await db
      .select({ isPreferred: householdMembers.isDefault })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, household.id),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);
    return {
      householdId: household.id,
      householdName: household.name,
      isPreferred: membership?.isPreferred ?? false,
    };
  });

export const leaveHousehold = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ householdId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [membership] = await db
      .select({ role: householdMembers.role })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);
    if (!membership) {
      throw new Error("Household membership not found.");
    }
    if (membership.role === "owner") {
      throw new Error("Owners cannot leave their household.");
    }
    await db.transaction(async (tx) => {
      await tx
        .delete(householdMembers)
        .where(
          and(
            eq(householdMembers.householdId, data.householdId),
            eq(householdMembers.userId, userId),
          ),
        );
      await ensurePreferredHousehold(tx, userId);
    });
    return null;
  });

export const listHouseholdMembers = createServerFn({ method: "GET" })
  .validator(authenticated.extend({ householdId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [viewer] = await db
      .select({ role: householdMembers.role })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);
    if (!viewer) {
      throw new Error("Forbidden.");
    }

    return db
      .select({
        user_id: householdMembers.userId,
        member_role: householdMembers.role,
        email: authUsers.email,
        profile_name: userPreferences.profileName,
      })
      .from(householdMembers)
      .innerJoin(authUsers, eq(authUsers.id, householdMembers.userId))
      .leftJoin(userPreferences, eq(userPreferences.userId, householdMembers.userId))
      .where(eq(householdMembers.householdId, data.householdId));
  });

export const removeHouseholdMember = createServerFn({ method: "POST" })
  .validator(
    authenticated.extend({
      householdId: z.string().uuid(),
      memberUserId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [owner] = await db
      .select({ role: householdMembers.role })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);
    if (owner?.role !== "owner") {
      throw new Error("Only household owners can remove members.");
    }
    if (data.memberUserId === userId) {
      throw new Error("Owners cannot remove themselves.");
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(householdMembers)
        .where(
          and(
            eq(householdMembers.householdId, data.householdId),
            eq(householdMembers.userId, data.memberUserId),
          ),
        );
      await ensurePreferredHousehold(tx, data.memberUserId);
    });
    return null;
  });

export const setPreferredHousehold = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ householdId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    await db.transaction((tx) => setPreferredMembership(tx, userId, data.householdId));
    return { householdId: data.householdId };
  });

export const renameHousehold = createServerFn({ method: "POST" })
  .validator(
    authenticated.extend({ householdId: z.string().uuid(), name: householdNameSchema }),
  )
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [membership] = await db
      .select({ role: householdMembers.role })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);
    if (membership?.role !== "owner") {
      throw new Error("Only household owners can rename the household.");
    }
    const [household] = await db
      .update(households)
      .set({ name: data.name, updatedAt: new Date() })
      .where(eq(households.id, data.householdId))
      .returning({ id: households.id, name: households.name });
    return household;
  });
