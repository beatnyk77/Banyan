import type { EstateJson } from "./estate-schema";

function mergeArray<T>(base: T[], incoming: T[] | undefined): T[] {
  if (!incoming?.length) return base;
  return [...base, ...incoming];
}

export function mergeEstateDelta(
  base: EstateJson,
  delta: Partial<EstateJson>
): EstateJson {
  return {
    version: 1,
    owner: { ...base.owner, ...(delta.owner ?? {}) },
    family: mergeArray(base.family, delta.family),
    assets: mergeArray(base.assets, delta.assets),
    bequests: mergeArray(base.bequests, delta.bequests),
    digital_death_instructions: mergeArray(
      base.digital_death_instructions,
      delta.digital_death_instructions
    ),
    completed_classes: [
      ...new Set([...base.completed_classes, ...(delta.completed_classes ?? [])]),
    ],
  };
}