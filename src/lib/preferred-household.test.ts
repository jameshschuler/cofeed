import { describe, expect, it } from "vitest";
import { pickBabyProfileBabyId, pickPreferredHousehold } from "./preferred-household";

const at = (value: string) => new Date(value);

describe("pickPreferredHousehold", () => {
  it("keeps the current preferred household", () => {
    expect(
      pickPreferredHousehold([
        {
          householdId: "own",
          role: "owner",
          isDefault: false,
          createdAt: at("2026-01-01"),
        },
        {
          householdId: "joined",
          role: "caregiver",
          isDefault: true,
          createdAt: at("2026-02-01"),
        },
      ]),
    ).toBe("joined");
  });

  it("falls back to the household the user owns", () => {
    expect(
      pickPreferredHousehold([
        {
          householdId: "joined",
          role: "caregiver",
          isDefault: false,
          createdAt: at("2026-01-01"),
        },
        {
          householdId: "own",
          role: "owner",
          isDefault: false,
          createdAt: at("2026-03-01"),
        },
      ]),
    ).toBe("own");
  });

  it("otherwise picks the earliest membership", () => {
    expect(
      pickPreferredHousehold([
        {
          householdId: "later",
          role: "caregiver",
          isDefault: false,
          createdAt: at("2026-03-01"),
        },
        {
          householdId: "earlier",
          role: "viewer",
          isDefault: false,
          createdAt: at("2026-01-01"),
        },
      ]),
    ).toBe("earlier");
  });

  it("returns null with no memberships", () => {
    expect(pickPreferredHousehold([])).toBeNull();
  });
});

describe("pickBabyProfileBabyId", () => {
  it("shows the owner's own baby even when another household is preferred", () => {
    expect(
      pickBabyProfileBabyId(
        [
          { member_role: "caregiver", baby_id: "partner-baby" },
          { member_role: "owner", baby_id: "own-baby" },
        ],
        "partner-baby",
      ),
    ).toBe("own-baby");
  });

  it("falls back to the preferred baby for users who don't own a household", () => {
    expect(
      pickBabyProfileBabyId(
        [{ member_role: "caregiver", baby_id: "partner-baby" }],
        "partner-baby",
      ),
    ).toBe("partner-baby");
  });

  it("ignores an owned household that has no baby yet", () => {
    expect(
      pickBabyProfileBabyId(
        [{ member_role: "owner", baby_id: null }],
        "preferred-baby",
      ),
    ).toBe("preferred-baby");
  });
});
