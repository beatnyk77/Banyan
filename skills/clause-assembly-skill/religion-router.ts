import type { EstateJson } from "../intake-skill/estate-schema";
import { CLAUSE_LIBRARY, getClause } from "./library";

export type ReligionBranch = "hindu" | "christian" | "parsi" | "muslim" | "other";

const BRANCH_CLAUSE: Record<ReligionBranch, string | null> = {
  hindu: "HINDU_SUCCESSION_001",
  christian: "CHRISTIAN_SUCCESSION_001",
  parsi: "PARSI_SUCCESSION_001",
  muslim: "MUSLIM_NOTICE_001",
  other: null,
};

export function resolveReligionBranch(estate: EstateJson): ReligionBranch {
  return estate.owner.religion;
}

export function getBranchClauseId(branch: ReligionBranch): string | null {
  return BRANCH_CLAUSE[branch];
}

export function getClausesForBranch(branch: ReligionBranch): string[] {
  return CLAUSE_LIBRARY.clauses
    .filter(
      (c) =>
        c.branches.includes("common") ||
        (branch !== "other" && c.branches.includes(branch))
    )
    .map((c) => c.id);
}

export function validateMuslimBequests(estate: EstateJson): {
  capped: boolean;
  totalPct: number;
} {
  if (estate.owner.religion !== "muslim") {
    return { capped: false, totalPct: 0 };
  }

  const totalPct = estate.bequests.reduce(
    (sum, b) => sum + (b.residue_pct ?? 0),
    0
  );
  return { capped: totalPct > 33.33, totalPct };
}

export function buildDefaultParams(estate: EstateJson): Record<string, string> {
  const primaryBeneficiary =
    estate.bequests[0]?.beneficiary_name ??
    estate.family.find((m) => m.is_nominee)?.name ??
    estate.family[0]?.name ??
    "my heirs";

  const executor =
    estate.family.find((m) => m.is_nominee)?.name ??
    estate.family[0]?.name ??
    primaryBeneficiary;

  const assetSummary =
    estate.assets.length > 0
      ? estate.assets
          .map((a) => `${a.class}${a.institution ? ` at ${a.institution}` : ""}`)
          .join("; ")
      : "all movable and immovable property";

  const digitalInstructions =
    estate.digital_death_instructions.length > 0
      ? estate.digital_death_instructions.join("; ")
      : "as recorded in my Banyan registry";

  return {
    owner_name: estate.owner.name,
    owner_dob: estate.owner.dob,
    beneficiary_name: primaryBeneficiary,
    executor_name: executor,
    asset_summary: assetSummary,
    residue_pct: String(
      estate.bequests[0]?.residue_pct ?? 100
    ),
    digital_instructions: digitalInstructions,
  };
}

export function selectClauseIdsForEstate(estate: EstateJson): string[] {
  const branch = resolveReligionBranch(estate);
  const ids: string[] = ["PREAMBLE_001", "REVOCATION_001"];

  const branchClause = getBranchClauseId(branch);
  if (branchClause) ids.push(branchClause);

  if (estate.bequests.length > 0) {
    const first = estate.bequests[0];
    if (first.asset_refs.length > 0 || estate.assets.length > 0) {
      ids.push("BEQUEST_SPECIFIC_001");
    }
    if (first.residue_pct !== undefined) {
      ids.push("BEQUEST_RESIDUE_001");
    }
  } else if (estate.family.length > 0) {
    ids.push("BEQUEST_RESIDUE_001");
  }

  if (estate.family.length > 0) {
    ids.push("EXECUTOR_001");
  }

  if (estate.digital_death_instructions.length > 0 || estate.assets.some((a) => a.class === "digital_account")) {
    ids.push("DIGITAL_ASSETS_001");
  }

  return ids;
}

export function assertClauseAllowedForBranch(
  clauseId: string,
  branch: ReligionBranch
): void {
  const clause = getClause(clauseId);
  if (!clause) return;
  if (
    clause.branches.includes("common") ||
    branch === "other" ||
    clause.branches.includes(branch)
  ) {
    return;
  }
  throw new Error(`Clause ${clauseId} is not valid for religion branch ${branch}`);
}