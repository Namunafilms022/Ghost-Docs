import { extractKnowledge } from '@ghost-docs/intelligence-engine';
import { markdownRenderer, jsonRenderer } from '@ghost-docs/docs';

export async function explain(repoUrl: string, options: { markdown?: boolean; json?: boolean }): Promise<void> {
  try {
    const knowledge = await extractKnowledge({ repoUrl });

    const renderer = options.json ? jsonRenderer : markdownRenderer;
    const output = renderer.render(knowledge);
    process.stdout.write(output);
    process.stdout.write('\n');
  } catch (error) {
    process.stderr.write(`Error: ${error}\n`);
    process.exit(1);
  }
}
