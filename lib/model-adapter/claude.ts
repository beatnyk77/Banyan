import Anthropic from "@anthropic-ai/sdk";
import { resolveModel } from "./router";
import type { ModelAdapter, ModelRequest, ModelResponse } from "./types";

export class ClaudeAdapter implements ModelAdapter {
  private client: Anthropic;

  constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(req: ModelRequest): Promise<ModelResponse> {
    const resp = await this.client.messages.create({
      model: resolveModel(req.task),
      max_tokens: req.maxTokens ?? 4096,
      system: req.system,
      messages: req.messages,
      tools: req.tools as Anthropic.Tool[] | undefined,
    });

    const texts = resp.content.filter((b) => b.type === "text");
    const tools = resp.content.filter((b) => b.type === "tool_use");

    return {
      content: texts.map((b) => (b as Anthropic.TextBlock).text).join(""),
      model: resp.model,
      usage: {
        inputTokens: resp.usage.input_tokens,
        outputTokens: resp.usage.output_tokens,
      },
      toolUse: tools.map((b) => {
        const tb = b as Anthropic.ToolUseBlock;
        return { id: tb.id, name: tb.name, input: tb.input };
      }),
      stopReason: resp.stop_reason as ModelResponse["stopReason"],
    };
  }

  async *stream(req: ModelRequest) {
    const stream = await this.client.messages.stream({
      model: resolveModel(req.task),
      max_tokens: req.maxTokens ?? 4096,
      system: req.system,
      messages: req.messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        yield { delta: chunk.delta.text };
      }
    }
  }
}