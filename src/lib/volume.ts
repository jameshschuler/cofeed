import type { VolumeUnit } from "../types/route-types";

export const ML_PER_OZ = 29.5735;
const MAX_PORTION_OZ = 60;

export function getMaxPortionVolume(unit: VolumeUnit) {
  return unit === "oz" ? MAX_PORTION_OZ : Math.round(MAX_PORTION_OZ * ML_PER_OZ);
}
