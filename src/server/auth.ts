import { createClient } from "@supabase/supabase-js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { babies, householdMembers } from "../db/schema";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
);

export const authenticated = z.object({ accessToken: z.string().min(1) });

export async function authenticate(accessToken: string) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error("Invalid session.");
  }
  return data.user.id;
}

export async function requireBabyMembership(babyId: string, userId: string) {
  const [membership] = await db
    .select({ householdId: householdMembers.householdId })
    .from(babies)
    .innerJoin(householdMembers, eq(householdMembers.householdId, babies.householdId))
    .where(and(eq(babies.id, babyId), eq(householdMembers.userId, userId)))
    .limit(1);

  if (!membership) {
    throw new Error("Forbidden.");
  }
}

export async function requireBabyWriteAccess(babyId: string, userId: string) {
  const [membership] = await db
    .select({ role: householdMembers.role })
    .from(babies)
    .innerJoin(householdMembers, eq(householdMembers.householdId, babies.householdId))
    .where(and(eq(babies.id, babyId), eq(householdMembers.userId, userId)))
    .limit(1);

  if (!membership || membership.role === "viewer") {
    throw new Error("Forbidden.");
  }
}
