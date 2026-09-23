import type { VolumeUnit } from "../types/route-types";

export type ImportRow = Record<string, string>;

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers, ...data] = rows;
  return data
    .filter((values) => values.some((value) => value.trim()))
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
    );
}

export function volumeUnit(value: string): VolumeUnit | null {
  const normalized = value.trim().toLowerCase();
  return normalized === "ml" || normalized === "oz" ? normalized : null;
}

export async function deterministicUuid(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const bytes = new Uint8Array(hash).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type FeedImportPlan = {
  kind: "feed";
  activityKey: string;
  startedAt: string;
  formulaPortionVolume: number | null;
  formulaPortionUnit: VolumeUnit | null;
  breastMilkPortionVolume: number | null;
  breastMilkPortionUnit: VolumeUnit | null;
};

export type PumpImportPlan = {
  kind: "pump";
  activityKey: string;
  startedAt: string;
  volume: number;
  unit: VolumeUnit;
};

export type SkipImportPlan = { kind: "skip" };

export type ImportRowPlan = FeedImportPlan | PumpImportPlan | SkipImportPlan;

export function planImportRow(row: ImportRow): ImportRowPlan {
  const type = row.Type?.trim();
  const startedAtEpoch = Number(row["Start Date/time (Epoch)"]);
  const activityKey = row._activityKey?.trim();

  if (!activityKey || !Number.isFinite(startedAtEpoch)) {
    return { kind: "skip" };
  }

  const startedAt = new Date(startedAtEpoch).toISOString();

  if (type === "Bottle Feed") {
    const formula = Number(row["[Bottle Feed] Formula Volume"]);
    const breastMilk = Number(row["[Bottle Feed] Breast Milk Volume"]);
    const formulaUnit = volumeUnit(row["[Bottle Feed] Formula Volume Unit"]);
    const breastMilkUnit = volumeUnit(row["[Bottle Feed] Breast Milk Volume Unit"]);

    if (
      (!formulaUnit || !Number.isFinite(formula) || formula <= 0) &&
      (!breastMilkUnit || !Number.isFinite(breastMilk) || breastMilk <= 0)
    ) {
      return { kind: "skip" };
    }

    return {
      kind: "feed",
      activityKey,
      startedAt,
      formulaPortionVolume: formulaUnit && formula > 0 ? formula : null,
      formulaPortionUnit: formulaUnit && formula > 0 ? formulaUnit : null,
      breastMilkPortionVolume: breastMilkUnit && breastMilk > 0 ? breastMilk : null,
      breastMilkPortionUnit: breastMilkUnit && breastMilk > 0 ? breastMilkUnit : null,
    };
  }

  if (type === "Pump") {
    const volume = Number(row["[Pump] Total Volume"]);
    const unit = volumeUnit(row["[Pump] Total Volume Unit"]);

    if (!unit || !Number.isFinite(volume) || volume <= 0) {
      return { kind: "skip" };
    }

    return { kind: "pump", activityKey, startedAt, volume, unit };
  }

  return { kind: "skip" };
}
