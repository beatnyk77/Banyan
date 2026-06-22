import { ClaudeAdapter } from "@/lib/model-adapter";
import type { ModelMessage } from "@/lib/model-adapter/types";
import type { EstateJson } from "./estate-schema";
import { mergeEstateDelta } from "./merge-delta";
import { getStatePrompt, OPENING_MESSAGES } from "./prompts";
import { nextState, type IntakeStateId } from "./state-machine";
import type { IntakeTurnResult } from "./types";

const RECORD_TOOL = {
  name: "record_intake_progress",
  description:
    "Record structured estate data extracted from the user's message and provide the assistant reply.",
  input_schema: {
    type: "object" as const,
    properties: {
      assistant_reply: {
        type: "string",
        description: "Your conversational reply to the user",
      },
      estate_delta: {
        type: "object",
        description: "Partial estate.json fields to merge",
      },
      advance_state: {
        type: "boolean",
        description: "True when the current section is sufficiently complete",
      },
    },
    required: ["assistant_reply", "estate_delta", "advance_state"],
  },
};

export interface ProcessTurnInput {
  currentState: IntakeStateId;
  estate: EstateJson;
  userMessage?: string;
  recentMessages: ModelMessage[];
}

function fallbackTurn(input: ProcessTurnInput): IntakeTurnResult {
  const { currentState, userMessage } = input;
  const advance = Boolean(userMessage?.trim());
  const following = advance ? nextState(currentState) : currentState;
  const next = following ?? currentState;

  return {
    assistantMessage: advance
      ? OPENING_MESSAGES[next] ?? "Thank you. Let's continue."
      : OPENING_MESSAGES[currentState],
    estateDelta: {},
    nextState: next,
    completed: next === "complete",
  };
}

export async function processIntakeTurn(
  input: ProcessTurnInput
): Promise<IntakeTurnResult & { estate: EstateJson }> {
  const { currentState, estate, userMessage, recentMessages } = input;

  if (!userMessage?.trim()) {
    return {
      assistantMessage: OPENING_MESSAGES[currentState],
      estateDelta: {},
      nextState: currentState,
      completed: false,
      estate,
    };
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    const result = fallbackTurn(input);
    return { ...result, estate };
  }

  const adapter = new ClaudeAdapter();
  const contextSummary = JSON.stringify({
    owner_name: estate.owner.name || "(not yet recorded)",
    asset_count: estate.assets.length,
    family_count: estate.family.length,
    completed_classes: estate.completed_classes,
  });

  const messages: ModelMessage[] = [
    ...recentMessages.slice(-8),
    { role: "user", content: userMessage },
  ];

  const response = await adapter.complete({
    task: "intake",
    system: `${getStatePrompt(currentState)}

Current estate summary (no sensitive IDs): ${contextSummary}
Current state: ${currentState}
Use the record_intake_progress tool for every response.`,
    messages,
    tools: [RECORD_TOOL],
    maxTokens: 1024,
  });

  const toolCall = response.toolUse?.find((t) => t.name === "record_intake_progress");
  if (!toolCall) {
    const result = fallbackTurn(input);
    return { ...result, estate };
  }

  const input_ = toolCall.input as {
    assistant_reply: string;
    estate_delta: Partial<EstateJson>;
    advance_state: boolean;
  };

  const merged = mergeEstateDelta(estate, input_.estate_delta ?? {});
  const following = input_.advance_state ? nextState(currentState) : currentState;
  const next = following ?? currentState;

  return {
    assistantMessage: input_.assistant_reply,
    estateDelta: input_.estate_delta ?? {},
    nextState: next,
    completed: next === "complete",
    estate: merged,
  };
}