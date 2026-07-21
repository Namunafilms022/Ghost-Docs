import OpenAI from 'openai';
import type { LLMProvider } from './types.js';

export class OpenAIChat implements LLMProvider {
  private client: OpenAI;
  readonly modelName: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey });
    this.modelName = model;
  }

  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: Record<string, unknown>,
  ): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages,
      ...options,
    });

    return response.choices[0]?.message?.content ?? '';
  }

  async *generateStream(
    prompt: string,
    systemPrompt?: string,
    options?: Record<string, unknown>,
  ): AsyncIterable<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const stream = await this.client.chat.completions.create({
      model: this.modelName,
      messages,
      stream: true,
      ...options,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}
