import { describe, it, expect } from "vitest";
import { resolveModel } from "../../lib/model-adapter/router";

describe("ModelAdapter tier routing", () => {
  it("intake → Haiku", () => expect(resolveModel("intake")).toContain("haiku"));
  it("clause_assembly → Sonnet", () =>
    expect(resolveModel("clause_assembly")).toContain("sonnet"));
  it("summarise → Sonnet", () => expect(resolveModel("summarise")).toContain("sonnet"));
  it("estate_review → Opus", () => expect(resolveModel("estate_review")).toContain("opus"));
});