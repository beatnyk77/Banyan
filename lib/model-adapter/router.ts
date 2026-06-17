import type { ModelTask } from "./types";

const TIER_MAP: Record<ModelTask, string> = {
  intake: "claude-haiku-4-5-20251001",
  clause_assembly: "claude-sonnet-4-6",
  summarise: "claude-sonnet-4-6",
  estate_review: "claude-opus-4-8",
};

export function resolveModel(task: ModelTask): string {
  return TIER_MAP[task];
}