import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider } from './types.js';

export class AnthropicChat implements LLMProvider {
  private client: Anthropic;
  readonly modelName: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic({ apiKey });
    this.modelName = model;
  }

  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: Record<string, unknown>,
  ): Promise<string> {
    const { stream: _, max_tokens, ...rest } = options ?? {};

    const message = await this.client.messages.create({
      model: this.modelName,
      max_tokens: (max_tokens as number | undefined) ?? 4096,
      system: systemPrompt ?? '',
      messages: [{ role: 'user', content: prompt }],
      ...rest,
    });

    const block = message.content[0];
    return block?.type === 'text' ? (block as Anthropic.TextBlock).text : '';
  }

  async *generateStream(
    prompt: string,
    systemPrompt?: string,
    options?: Record<string, unknown>,
  ): AsyncIterable<string> {
    const { max_tokens, ...rest } = options ?? {};

    const stream = this.client.messages.stream({
      model: this.modelName,
      max_tokens: (max_tokens as number | undefined) ?? 4096,
      system: systemPrompt ?? '',
      messages: [{ role: 'user', content: prompt }],
      ...rest,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta as { text?: string };
        if (delta.text) {
          yield delta.text;
        }
      }
    }
  }
}
