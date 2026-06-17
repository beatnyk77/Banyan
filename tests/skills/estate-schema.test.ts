import { describe, it, expect } from "vitest";
import { EstateJsonSchema } from "../../skills/intake-skill/estate-schema";

describe("EstateJsonSchema", () => {
  const valid = {
    version: 1 as const,
    owner: {
      name: "Ramesh Kumar Sharma",
      dob: "1965-03-15",
      religion: "hindu" as const,
    },
    family: [{ name: "Sunita Sharma", relationship: "spouse", is_nominee: true }],
    assets: [
      { class: "bank" as const, institution: "SBI", account_type: "savings" },
      { class: "insurance" as const, institution: "LIC", policy_no: "12345" },
    ],
    bequests: [{ beneficiary_name: "Sunita Sharma", asset_refs: ["bank-0"] }],
    completed_classes: ["bank" as const, "insurance" as const],
  };

  it("parses a valid Hindu estate", () => {
    const result = EstateJsonSchema.parse(valid);
    expect(result.owner.name).toBe("Ramesh Kumar Sharma");
    expect(result.assets).toHaveLength(2);
  });

  it("rejects invalid religion", () => {
    expect(() =>
      EstateJsonSchema.parse({ ...valid, owner: { ...valid.owner, religion: "buddhist" } })
    ).toThrow();
  });

  it("rejects invalid dob format", () => {
    expect(() =>
      EstateJsonSchema.parse({ ...valid, owner: { ...valid.owner, dob: "15-03-1965" } })
    ).toThrow();
  });

  it("accepts Muslim estate with bequests", () => {
    const muslim = {
      ...valid,
      owner: { ...valid.owner, religion: "muslim" as const },
      bequests: [{ beneficiary_name: "Son", residue_pct: 33 }],
    };
    expect(EstateJsonSchema.parse(muslim).owner.religion).toBe("muslim");
  });
});