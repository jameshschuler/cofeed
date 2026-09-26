import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { babies, householdMembers } from "../db/schema";
import { babyProfileFieldsSchema, withDateOfBirthCheck } from "../lib/api-contracts";
import { authenticated, authenticate } from "./auth";

export const getBabyProfile = createServerFn({ method: "GET" })
  .validator(authenticated.extend({ babyId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [baby] = await db
      .select({
        id: babies.id,
        name: babies.name,
        dateOfBirth: babies.dateOfBirth,
        householdId: babies.householdId,
        memberRole: householdMembers.role,
      })
      .from(babies)
      .innerJoin(householdMembers, eq(householdMembers.householdId, babies.householdId))
      .where(and(eq(babies.id, data.babyId), eq(householdMembers.userId, userId)))
      .limit(1);
    if (!baby) {
      throw new Error("Forbidden.");
    }
    return baby;
  });

export const updateBabyProfile = createServerFn({ method: "POST" })
  .validator(withDateOfBirthCheck(authenticated.extend(babyProfileFieldsSchema.shape)))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [owner] = await db
      .select({ role: householdMembers.role })
      .from(babies)
      .innerJoin(householdMembers, eq(householdMembers.householdId, babies.householdId))
      .where(and(eq(babies.id, data.babyId), eq(householdMembers.userId, userId)))
      .limit(1);
    if (owner?.role !== "owner") {
      throw new Error("Only household owners can update the baby profile.");
    }

    const [baby] = await db
      .update(babies)
      .set({
        name: data.name.trim(),
        dateOfBirth: data.dateOfBirth,
        updatedAt: new Date(),
      })
      .where(eq(babies.id, data.babyId))
      .returning({ id: babies.id, name: babies.name, dateOfBirth: babies.dateOfBirth });
    return baby;
  });
