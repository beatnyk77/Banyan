import { createHash } from "crypto";
import { ClaudeAdapter } from "@/lib/model-adapter";
import type { EstateJson } from "../intake-skill/estate-schema";
import {
  CLAUSE_LIBRARY,
  getClause,
  isClauseLibrarySigned,
} from "./library";
import {
  assertClauseAllowedForBranch,
  buildDefaultParams,
  resolveReligionBranch,
  selectClauseIdsForEstate,
  type ReligionBranch,
} from "./religion-router";
import type { AssembledWill, ClauseSelection } from "./types";
import { UnknownClauseIdError } from "./types";

const SELECT_CLAUSES_TOOL = {
  name: "select_clauses",
  description:
    "Select clause IDs and parameter values from the approved library. Return IDs only — never invent legal text.",
  input_schema: {
    type: "object" as const,
    properties: {
      clause_ids: {
        type: "array",
        items: { type: "string" },
        description: "Ordered list of clause IDs from the approved library",
      },
      params: {
        type: "object",
        description: "Parameter values for template substitution",
        additionalProperties: { type: "string" },
      },
    },
    required: ["clause_ids", "params"],
  },
};

export interface AssembleWillOptions {
  useLlm?: boolean;
}

function interpolate(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => params[key] ?? "");
}

export function resolveClauseSelection(
  selection: ClauseSelection,
  branch: ReligionBranch
): string {
  const paragraphs: string[] = [];

  for (const id of selection.clause_ids) {
    const clause = getClause(id);
    if (!clause) {
      throw new UnknownClauseIdError(id);
    }
    assertClauseAllowedForBranch(id, branch);
    paragraphs.push(interpolate(clause.template, selection.params));
  }

  return paragraphs.join("\n\n");
}

export function computeClauseSetHash(selection: ClauseSelection): string {
  const payload = JSON.stringify({
    ids: selection.clause_ids,
    params: selection.params,
    version: CLAUSE_LIBRARY.version,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function assertRenderedTextFromLibrary(
  renderedText: string,
  selection: ClauseSelection,
  branch: ReligionBranch
): void {
  const expected = resolveClauseSelection(selection, branch);
  if (renderedText !== expected) {
    throw new Error(
      "Rendered text does not match library resolution — possible out-of-library content"
    );
  }
}

async function selectClausesWithLlm(
  estate: EstateJson,
  branch: ReligionBranch
): Promise<ClauseSelection> {
  const defaultParams = buildDefaultParams(estate);
  const allowedIds = selectClauseIdsForEstate(estate);

  const adapter = new ClaudeAdapter();
  const response = await adapter.complete({
    task: "clause_assembly",
    system: `You are a will clause selector for Indian estates. You MUST use the select_clauses tool.
Select only from these approved clause IDs: ${allowedIds.join(", ")}.
Never invent clause IDs or legal text. Provide parameter values for template placeholders.
Religion branch: ${branch}.`,
    messages: [
      {
        role: "user",
        content: `Select clauses for this estate summary (no sensitive IDs):
${JSON.stringify({
  owner_name: estate.owner.name,
  religion: branch,
  family_count: estate.family.length,
  asset_count: estate.assets.length,
  bequest_count: estate.bequests.length,
  has_digital: estate.digital_death_instructions.length > 0,
})}`,
      },
    ],
    tools: [SELECT_CLAUSES_TOOL],
    maxTokens: 1024,
  });

  const toolCall = response.toolUse?.find((t) => t.name === "select_clauses");
  if (!toolCall) {
    return {
      clause_ids: allowedIds,
      params: defaultParams,
    };
  }

  const input = toolCall.input as ClauseSelection;
  return {
    clause_ids: input.clause_ids ?? allowedIds,
    params: { ...defaultParams, ...(input.params ?? {}) },
  };
}

export async function assembleWill(
  estate: EstateJson,
  options: AssembleWillOptions = {}
): Promise<AssembledWill> {
  const branch = resolveReligionBranch(estate);
  const useLlm =
    options.useLlm ?? Boolean(process.env.ANTHROPIC_API_KEY);

  const selection = useLlm
    ? await selectClausesWithLlm(estate, branch)
    : {
        clause_ids: selectClauseIdsForEstate(estate),
        params: buildDefaultParams(estate),
      };

  const renderedText = resolveClauseSelection(selection, branch);
  const clauseSetHash = computeClauseSetHash(selection);

  return {
    clause_ids: selection.clause_ids,
    params: selection.params,
    clause_set_hash: clauseSetHash,
    clause_library_version: CLAUSE_LIBRARY.version,
    religion_branch: branch,
    rendered_text: renderedText,
  };
}

export function assertKitIssuanceAllowed(): void {
  if (!isClauseLibrarySigned()) {
    throw new Error(
      "Clause library is not lawyer-signed. Set CLAUSE_LIBRARY_SIGNED=true after counsel sign-off."
    );
  }
}