import { describe, it, expect, vi, beforeEach } from 'vitest';

const ENV_KEYS = ['LLM_PROVIDER', 'OPENAI_API_KEY', 'OPENAI_MODEL', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL'] as const;

describe('Config', () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
    vi.resetModules();
  });

  it('defaults to openai provider', async () => {
    const { config } = await import('@ghost-docs/config');
    expect(config.llmProvider).toBe('openai');
  });

  it('reads provider from env', async () => {
    process.env.LLM_PROVIDER = 'anthropic';
    const { config } = await import('@ghost-docs/config');
    expect(config.llmProvider).toBe('anthropic');
  });

  it('has default model values', async () => {
    const { config } = await import('@ghost-docs/config');
    expect(config.openaiModel).toBe('gpt-4o-mini');
    expect(config.anthropicModel).toBe('claude-sonnet-4-20250514');
  });

  it('reads custom model from env', async () => {
    process.env.OPENAI_MODEL = 'gpt-4';
    const { config } = await import('@ghost-docs/config');
    expect(config.openaiModel).toBe('gpt-4');
  });
});
