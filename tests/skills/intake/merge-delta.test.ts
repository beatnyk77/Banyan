import { describe, it, expect } from "vitest";
import { createEmptyEstate } from "@/skills/intake-skill/empty-estate";
import { mergeEstateDelta } from "@/skills/intake-skill/merge-delta";

describe("mergeEstateDelta", () => {
  it("merges owner fields", () => {
    const base = createEmptyEstate();
    const merged = mergeEstateDelta(base, {
      owner: { name: "Ramesh Kumar Sharma" },
    });
    expect(merged.owner.name).toBe("Ramesh Kumar Sharma");
  });

  it("appends assets and deduplicates completed_classes", () => {
    const base = createEmptyEstate();
    const merged = mergeEstateDelta(base, {
      assets: [{ class: "bank", institution: "SBI" }],
      completed_classes: ["bank"],
    });
    expect(merged.assets).toHaveLength(1);
    expect(merged.completed_classes).toEqual(["bank"]);
  });
});