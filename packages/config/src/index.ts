import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  llmProvider: z.enum(['openai', 'anthropic']).default('openai'),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().default('gpt-4o-mini'),
  anthropicApiKey: z.string().optional(),
  anthropicModel: z.string().default('claude-sonnet-4-20250514'),
  githubToken: z.string().optional(),
});

function loadConfig() {
  const parsed = configSchema.safeParse({
    llmProvider: process.env.LLM_PROVIDER,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL,
    githubToken: process.env.GITHUB_TOKEN,
  });

  if (!parsed.success) {
    console.error('Invalid configuration:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const config = loadConfig();
export type Config = z.infer<typeof configSchema>;
