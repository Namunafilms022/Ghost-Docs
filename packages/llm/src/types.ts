export interface LLMProvider {
  generate(
    prompt: string,
    systemPrompt?: string,
    options?: Record<string, unknown>,
  ): Promise<string>;

  generateStream(
    prompt: string,
    systemPrompt?: string,
    options?: Record<string, unknown>,
  ): AsyncIterable<string>;

  readonly modelName: string;
}
