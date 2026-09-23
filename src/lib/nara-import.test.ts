import { describe, expect, it } from "vitest";
import { deterministicUuid, parseCsv, planImportRow, volumeUnit } from "./nara-import";
import type { ImportRow } from "./nara-import";

describe("parseCsv", () => {
  it("parses simple rows into header-keyed objects", () => {
    const rows = parseCsv("Type,Volume\nBottle Feed,100\nPump,50");

    expect(rows).toEqual([
      { Type: "Bottle Feed", Volume: "100" },
      { Type: "Pump", Volume: "50" },
    ]);
  });

  it("handles quoted fields containing commas and escaped quotes", () => {
    const rows = parseCsv('Type,Notes\nBottle Feed,"hello, ""world"""');

    expect(rows).toEqual([{ Type: "Bottle Feed", Notes: 'hello, "world"' }]);
  });

  it("handles CRLF and LF line endings", () => {
    const rows = parseCsv("Type,Volume\r\nBottle Feed,100\nPump,50\r\n");

    expect(rows).toEqual([
      { Type: "Bottle Feed", Volume: "100" },
      { Type: "Pump", Volume: "50" },
    ]);
  });

  it("skips blank rows", () => {
    const rows = parseCsv("Type,Volume\nBottle Feed,100\n,\nPump,50");

    expect(rows).toEqual([
      { Type: "Bottle Feed", Volume: "100" },
      { Type: "Pump", Volume: "50" },
    ]);
  });

  it("returns an empty array for header-only input", () => {
    expect(parseCsv("Type,Volume")).toEqual([]);
  });
});

describe("volumeUnit", () => {
  it("normalizes case and whitespace for supported units", () => {
    expect(volumeUnit("ML")).toBe("ml");
    expect(volumeUnit(" oz ")).toBe("oz");
    expect(volumeUnit("Oz")).toBe("oz");
  });

  it("returns null for unsupported or empty units", () => {
    expect(volumeUnit("cups")).toBeNull();
    expect(volumeUnit("")).toBeNull();
  });
});

describe("deterministicUuid", () => {
  it("is deterministic for the same input", async () => {
    const first = await deterministicUuid("feed:abc123");
    const second = await deterministicUuid("feed:abc123");

    expect(first).toBe(second);
  });

  it("produces different ids for different input", async () => {
    const feedId = await deterministicUuid("feed:abc123");
    const pumpId = await deterministicUuid("pump:abc123");

    expect(feedId).not.toBe(pumpId);
  });

  it("produces a valid version-5-style UUID", async () => {
    const id = await deterministicUuid("feed:abc123");

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});

function makeRow(overrides: Partial<ImportRow>): ImportRow {
  return {
    Type: "",
    "Start Date/time (Epoch)": "1700000000000",
    _activityKey: "row-1",
    "[Bottle Feed] Formula Volume": "",
    "[Bottle Feed] Formula Volume Unit": "",
    "[Bottle Feed] Breast Milk Volume": "",
    "[Bottle Feed] Breast Milk Volume Unit": "",
    "[Pump] Total Volume": "",
    "[Pump] Total Volume Unit": "",
    ...overrides,
  };
}

describe("planImportRow", () => {
  it("skips rows missing an activity key", () => {
    const plan = planImportRow(makeRow({ _activityKey: "" }));
    expect(plan.kind).toBe("skip");
  });

  it("skips rows with a non-numeric started-at value", () => {
    const plan = planImportRow(makeRow({ "Start Date/time (Epoch)": "not-a-number" }));
    expect(plan.kind).toBe("skip");
  });

  it("plans a bottle feed with formula only", () => {
    const plan = planImportRow(
      makeRow({
        Type: "Bottle Feed",
        "[Bottle Feed] Formula Volume": "4",
        "[Bottle Feed] Formula Volume Unit": "OZ",
      }),
    );

    expect(plan).toMatchObject({
      kind: "feed",
      activityKey: "row-1",
      formulaPortionVolume: 4,
      formulaPortionUnit: "oz",
      breastMilkPortionVolume: null,
      breastMilkPortionUnit: null,
    });
  });

  it("plans a bottle feed with breast milk only", () => {
    const plan = planImportRow(
      makeRow({
        Type: "Bottle Feed",
        "[Bottle Feed] Breast Milk Volume": "90",
        "[Bottle Feed] Breast Milk Volume Unit": "ml",
      }),
    );

    expect(plan).toMatchObject({
      kind: "feed",
      formulaPortionVolume: null,
      formulaPortionUnit: null,
      breastMilkPortionVolume: 90,
      breastMilkPortionUnit: "ml",
    });
  });

  it("plans a bottle feed with both formula and breast milk", () => {
    const plan = planImportRow(
      makeRow({
        Type: "Bottle Feed",
        "[Bottle Feed] Formula Volume": "2",
        "[Bottle Feed] Formula Volume Unit": "oz",
        "[Bottle Feed] Breast Milk Volume": "2",
        "[Bottle Feed] Breast Milk Volume Unit": "oz",
      }),
    );

    expect(plan).toMatchObject({
      kind: "feed",
      formulaPortionVolume: 2,
      breastMilkPortionVolume: 2,
    });
  });

  it("skips a bottle feed with no positive, unit-tagged volume", () => {
    const plan = planImportRow(
      makeRow({
        Type: "Bottle Feed",
        "[Bottle Feed] Formula Volume": "0",
        "[Bottle Feed] Formula Volume Unit": "oz",
      }),
    );

    expect(plan.kind).toBe("skip");
  });

  it("skips a bottle feed missing a recognized unit", () => {
    const plan = planImportRow(
      makeRow({
        Type: "Bottle Feed",
        "[Bottle Feed] Formula Volume": "4",
        "[Bottle Feed] Formula Volume Unit": "cups",
      }),
    );

    expect(plan.kind).toBe("skip");
  });

  it("plans a pump session with a positive volume and supported unit", () => {
    const plan = planImportRow(
      makeRow({
        Type: "Pump",
        "[Pump] Total Volume": "3.5",
        "[Pump] Total Volume Unit": "oz",
      }),
    );

    expect(plan).toMatchObject({
      kind: "pump",
      activityKey: "row-1",
      volume: 3.5,
      unit: "oz",
    });
  });

  it("skips a pump session with a zero or negative volume", () => {
    const plan = planImportRow(
      makeRow({
        Type: "Pump",
        "[Pump] Total Volume": "0",
        "[Pump] Total Volume Unit": "oz",
      }),
    );

    expect(plan.kind).toBe("skip");
  });

  it("skips unrecognized activity types", () => {
    const plan = planImportRow(makeRow({ Type: "Diaper Change" }));
    expect(plan.kind).toBe("skip");
  });
});
