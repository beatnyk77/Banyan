export interface ClauseSelection {
  clause_ids: string[];
  params: Record<string, string>;
}

export interface AssembledWill {
  clause_ids: string[];
  clause_set_hash: string;
  clause_library_version: string;
  religion_branch: string;
  rendered_text: string;
}

export class UnknownClauseIdError extends Error {
  constructor(id: string) {
    super(`Unknown clause ID: ${id}`);
    this.name = "UnknownClauseIdError";
  }
}