import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import {
  authUsers,
  babies,
  householdMembers,
  households,
  userPreferences,
} from "../db/schema";
import { getZonedTodayKey, isValidTimezone } from "../lib/timezone";
import { authenticated, authenticate } from "./auth";
import { ensurePreferredHousehold } from "./preferred-household";

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  if ("code" in error && error.code === "23505") {
    return true;
  }
  return "cause" in error && isUniqueViolation(error.cause);
}

async function findOrCreateDefaultHousehold(
  userId: string,
  timezone: string | null | undefined,
) {
  return db.transaction(async (tx) => {
    let householdId = await ensurePreferredHousehold(tx, userId);

    if (!householdId) {
      const [household] = await tx
        .insert(households)
        .values({
          name: "My Household",
          timezone: timezone && isValidTimezone(timezone) ? timezone : "UTC",
          joinCode: crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase(),
        })
        .returning({ id: households.id });
      householdId = household.id;
      await tx
        .insert(householdMembers)
        .values({ householdId, userId, role: "owner", isDefault: true });
    }

    let [baby] = await tx
      .select({ id: babies.id })
      .from(babies)
      .where(eq(babies.householdId, householdId))
      .orderBy(babies.createdAt)
      .limit(1);

    if (!baby) {
      [baby] = await tx
        .insert(babies)
        .values({
          householdId,
          name: "Baby",
          dateOfBirth: getZonedTodayKey(timezone),
        })
        .returning({ id: babies.id });
    }

    return { householdId, babyId: baby.id };
  });
}

export const getProfile = createServerFn({ method: "GET" })
  .validator(
    authenticated.extend({ timezone: z.string().max(64).nullable().optional() }),
  )
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const { householdId, babyId } = await findOrCreateDefaultHousehold(
      userId,
      data.timezone,
    ).catch((error: unknown) => {
      if (!isUniqueViolation(error)) {
        throw error;
      }
      return findOrCreateDefaultHousehold(userId, data.timezone);
    });

    const [currentMembership] = await db
      .select({ role: householdMembers.role })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);
    const [household] = await db
      .select({ joinCode: households.joinCode, name: households.name })
      .from(households)
      .where(eq(households.id, householdId));
    const memberships = await db
      .select({ householdId: householdMembers.householdId })
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId));

    const [profile] = await db
      .select({ profileName: userPreferences.profileName, email: authUsers.email })
      .from(authUsers)
      .leftJoin(userPreferences, eq(userPreferences.userId, authUsers.id))
      .where(eq(authUsers.id, userId));

    return {
      householdId,
      babyId,
      householdName: household.name,
      householdCount: memberships.length,
      joinCode: household.joinCode,
      memberRole: currentMembership?.role ?? "owner",
      profileName: profile?.profileName ?? profile?.email?.split("@")[0] ?? "Caregiver",
    };
  });

export const updateProfileName = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ profileName: z.string().trim().min(1).max(80) }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [preferences] = await db
      .insert(userPreferences)
      .values({ userId, profileName: data.profileName.trim() })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { profileName: data.profileName.trim(), updatedAt: new Date() },
      })
      .returning({ profileName: userPreferences.profileName });
    return preferences.profileName ?? data.profileName.trim();
  });
