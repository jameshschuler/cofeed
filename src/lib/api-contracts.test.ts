import { describe, expect, it } from "vitest";
import {
  createFeedRequestSchema,
  createPumpingRequestSchema,
  updateBabyProfileRequestSchema,
} from "./api-contracts";

describe("activity request contracts", () => {
  it("accepts a bottle feed with nullable portions", () => {
    const result = createFeedRequestSchema.safeParse({
      babyId: "2f55973a-da57-4cdc-81cc-b34c312af634",
      startedAt: "2026-09-21T12:00:00.000Z",
      formulaPortionVolume: 100,
      formulaPortionUnit: "ml",
      breastMilkPortionVolume: null,
      breastMilkPortionUnit: null,
      idempotencyKey: "86fb1474-5758-481a-8cb7-d92d990e19a0",
    });

    expect(result.success).toBe(true);
  });

  it("requires a positive pumping volume and supported unit", () => {
    const valid = createPumpingRequestSchema.safeParse({
      babyId: "2f55973a-da57-4cdc-81cc-b34c312af634",
      startedAt: "2026-09-21T12:00:00.000Z",
      volume: 120,
      unit: "ml",
      idempotencyKey: "86fb1474-5758-481a-8cb7-d92d990e19a0",
    });
    const invalid = createPumpingRequestSchema.safeParse({
      babyId: "2f55973a-da57-4cdc-81cc-b34c312af634",
      startedAt: "2026-09-21T12:00:00.000Z",
      volume: 0,
      unit: "cups",
      idempotencyKey: "86fb1474-5758-481a-8cb7-d92d990e19a0",
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("rejects an empty baby name and future date of birth", () => {
    const result = updateBabyProfileRequestSchema.safeParse({
      babyId: "2f55973a-da57-4cdc-81cc-b34c312af634",
      name: "",
      dateOfBirth: "2999-01-01",
    });

    expect(result.success).toBe(false);
  });
});
