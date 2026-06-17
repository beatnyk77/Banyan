export type ModelTask = "intake" | "clause_assembly" | "summarise" | "estate_review";

export interface ModelMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ModelRequest {
  task: ModelTask;
  system?: string;
  messages: ModelMessage[];
  tools?: AnthropicTool[];
  maxTokens?: number;
}

export interface ToolUseBlock {
  id: string;
  name: string;
  input: unknown;
}

export interface ModelResponse {
  content: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
  toolUse?: ToolUseBlock[];
  stopReason: "end_turn" | "tool_use" | "max_tokens";
}

export interface ModelAdapter {
  complete(req: ModelRequest): Promise<ModelResponse>;
  stream(req: ModelRequest): AsyncGenerator<{ delta: string }>;
}