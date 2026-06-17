import libraryJson from "./clauses.json";

export interface ClauseDefinition {
  id: string;
  branches: string[];
  template: string;
}

export interface ClauseLibrary {
  version: string;
  signed: boolean;
  clauses: ClauseDefinition[];
}

export const CLAUSE_LIBRARY: ClauseLibrary = libraryJson as ClauseLibrary;

const clauseMap = new Map(CLAUSE_LIBRARY.clauses.map((c) => [c.id, c]));

export function getClause(id: string): ClauseDefinition | undefined {
  return clauseMap.get(id);
}

export function getAllClauseIds(): string[] {
  return CLAUSE_LIBRARY.clauses.map((c) => c.id);
}

export function isClauseLibrarySigned(): boolean {
  return process.env.CLAUSE_LIBRARY_SIGNED === "true" && CLAUSE_LIBRARY.signed;
}