import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { userPreferences } from "../db/schema";
import { volumeUnitSchema } from "../lib/api-contracts";
import { authenticated, authenticate } from "./auth";

export const getPreferences = createServerFn({ method: "GET" })
  .validator(authenticated)
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [preferences] = await db
      .select({ displayVolumeUnit: userPreferences.displayVolumeUnit })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences ?? { displayVolumeUnit: "oz" as const };
  });

export const updatePreferences = createServerFn({ method: "POST" })
  .validator(authenticated.extend({ displayVolumeUnit: volumeUnitSchema }))
  .handler(async ({ data }) => {
    const userId = await authenticate(data.accessToken);
    const [preferences] = await db
      .insert(userPreferences)
      .values({ userId, displayVolumeUnit: data.displayVolumeUnit })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { displayVolumeUnit: data.displayVolumeUnit, updatedAt: new Date() },
      })
      .returning();
    return preferences;
  });
