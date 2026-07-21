import type { LLMProvider } from './types.js';
import { OpenAIChat } from './openai.js';
import { AnthropicChat } from './anthropic.js';

export function createLLM(
  config: {
    provider: string;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    openaiModel?: string;
    anthropicModel?: string;
  },
): LLMProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIChat(
        config.openaiApiKey ?? '',
        config.openaiModel ?? 'gpt-4o-mini',
      );
    case 'anthropic':
      return new AnthropicChat(
        config.anthropicApiKey ?? '',
        config.anthropicModel ?? 'claude-sonnet-4-20250514',
      );
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}
