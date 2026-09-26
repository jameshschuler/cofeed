import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { authUsers, householdMembers, households, userPreferences } from "../db/schema";
import { authenticated, authenticate } from "./auth";

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
      .select({ id: households.id })
      .from(households)
      .where(eq(households.joinCode, data.joinCode.trim().toUpperCase()))
      .limit(1);
    if (!household) {
      throw new Error("Household not found.");
    }
    await db
      .insert(householdMembers)
      .values({ householdId: household.id, userId, role: "caregiver" })
      .onConflictDoNothing();
    return { householdId: household.id };
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
    await db
      .delete(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, userId),
        ),
      );
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

    await db
      .delete(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, data.householdId),
          eq(householdMembers.userId, data.memberUserId),
        ),
      );
    return null;
  });
