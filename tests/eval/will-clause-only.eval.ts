import { readFileSync } from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import {
  assembleWill,
  assertRenderedTextFromLibrary,
  resolveClauseSelection,
} from "@/skills/clause-assembly-skill/assembler";
import { getAllClauseIds, getClause } from "@/skills/clause-assembly-skill/library";
import {
  resolveReligionBranch,
  validateMuslimBequests,
} from "@/skills/clause-assembly-skill/religion-router";
import { EstateJsonSchema } from "@/skills/intake-skill/estate-schema";
import { UnknownClauseIdError } from "@/skills/clause-assembly-skill/types";

const FIXTURES = [
  "hindu-simple",
  "hindu-joint",
  "muslim-estate",
  "christian-estate",
  "parsi-estate",
  "multi-asset",
] as const;

function loadFixture(name: string) {
  const raw = readFileSync(
    path.join(__dirname, "fixtures", `${name}.json`),
    "utf8"
  );
  return EstateJsonSchema.parse(JSON.parse(raw));
}

describe("Will clause-only invariant (Invariant 4)", () => {
  for (const fixture of FIXTURES) {
    it(`assembles ${fixture} from library templates only`, async () => {
      const estate = loadFixture(fixture);
      const will = await assembleWill(estate, { useLlm: false });
      const branch = resolveReligionBranch(estate);

      expect(will.clause_ids.length).toBeGreaterThan(0);
      expect(will.rendered_text.length).toBeGreaterThan(50);

      for (const id of will.clause_ids) {
        expect(getClause(id)).toBeDefined();
      }

      assertRenderedTextFromLibrary(
        will.rendered_text,
        { clause_ids: will.clause_ids, params: will.params },
        branch
      );

      if (fixture === "muslim-estate") {
        expect(will.clause_ids).toContain("MUSLIM_NOTICE_001");
        const { totalPct } = validateMuslimBequests(estate);
        expect(totalPct).toBeLessThanOrEqual(33.33);
      }

      if (fixture === "christian-estate") {
        expect(will.clause_ids).toContain("CHRISTIAN_SUCCESSION_001");
      }

      if (fixture === "parsi-estate") {
        expect(will.clause_ids).toContain("PARSI_SUCCESSION_001");
      }

      if (fixture === "multi-asset") {
        expect(will.clause_ids).toContain("DIGITAL_ASSETS_001");
      }
    });
  }

  it("rejects injected unknown clause IDs", () => {
    expect(() =>
      resolveClauseSelection(
        { clause_ids: ["INJECTED_EVIL_CLAUSE"], params: {} },
        "hindu"
      )
    ).toThrow(UnknownClauseIdError);
  });

  it("all library clause IDs are known to the index", () => {
    const ids = getAllClauseIds();
    expect(ids.length).toBeGreaterThanOrEqual(3);
    for (const id of ids) {
      expect(getClause(id)?.id).toBe(id);
    }
  });
});